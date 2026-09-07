import { useState, useEffect, useRef, useCallback } from 'react';
import { biometricApi } from '../api/biometrics';
import { attemptsApi } from '../api/attempts';
import { useApp } from '../context/AppContext';
import type { HeadPose, EyeTrackingInfo, DetectedObject } from '../types';

export const useProctoringMonitor = (
  examId: string | undefined,
  attemptId: string | undefined,
  cameraActive: boolean,
  captureFrame: () => string | null
) => {
  const { addViolation } = useApp();
  
  const [monitoringStatus, setMonitoringStatus] = useState<'ACTIVE' | 'WARNING' | 'ERROR' | 'CONNECTION WARNING'>('ACTIVE');
  const [facesDetected, setFacesDetected] = useState<number | null>(null);
  const [framesAnalyzed, setFramesAnalyzed] = useState(0);
  const [lastEvent, setLastEvent] = useState<string>('None');
  
  const [headPose, setHeadPose] = useState<HeadPose | null>(null);
  const [eyeTracking, setEyeTracking] = useState<EyeTrackingInfo | null>(null);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);

  // Debounce tracking (scaled to track multiple simultaneous violations)
  const consecutiveCountsRef = useRef<{ [key: string]: number }>({});
  
  // Smoothing history for head pose
  const smoothedHeadPoseRef = useRef<{ yaw: number, pitch: number, roll: number } | null>(null);
  
  // Track if proctoring started
  const proctoringStartedRef = useRef(false);

  // Cooldown tracking (60s)
  const lastEventTimeRef = useRef<{ [key: string]: number }>({});

  // Audio monitoring refs
  const [audioVolume, setAudioVolume] = useState<number>(0);
  const [isVoiceDetected, setIsVoiceDetected] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioAnimFrameRef = useRef<number | null>(null);
  const highNoiseStartTimeRef = useRef<number | null>(null);

  const logEventIfReady = useCallback(async (eventType: string, eventData: any = {}) => {
    if (!attemptId) return;
    
    const now = Date.now();
    const lastTime = lastEventTimeRef.current[eventType] || 0;
    
    // High-priority cheating events (face mismatch, phone, multiple faces, missing face) trigger every 3s
    const cooldownMs = ['face_mismatch', 'multiple_faces', 'phone_detected', 'no_face'].includes(eventType) ? 3000 : 12000;

    if (now - lastTime > cooldownMs) {
      lastEventTimeRef.current[eventType] = now;
      setLastEvent(eventType.toUpperCase());
      if (eventType !== 'proctoring_started' && eventType !== 'camera_error') {
        setMonitoringStatus('WARNING');
      }
      if (eventType === 'camera_error' || eventType === 'camera_disabled') {
        setMonitoringStatus('ERROR');
      }
      
      try {
        console.log(`[Proctoring] Event logged: ${eventType}`);
        await attemptsApi.logEvent(attemptId, {
          event_type: eventType,
          event_data: { ...eventData, severity: 'HIGH' }
        });
        
        if (eventType === 'no_face') {
          addViolation("Face Missing", "high", attemptId);
        } else if (eventType === 'multiple_faces') {
          addViolation("Multiple Faces", "high", attemptId);
        } else if (eventType === 'face_mismatch') {
          addViolation("Face Mismatch", "high", attemptId);
        } else if (eventType === 'looking_away') {
          addViolation("Eye Deviation", "medium", attemptId);
        } else if (eventType === 'phone_detected') {
          addViolation("Phone Detected", "high", attemptId);
        } else if (eventType === 'voice_detected') {
          addViolation("Voice Detected", "high", attemptId);
        } else if (eventType === 'camera_disabled' || eventType === 'camera_error') {
          addViolation("Camera Disconnected", "high", attemptId);
        }
      } catch (err) {
        console.error("Failed to log AttemptEvent", err);
      }
    } else {
      console.log(`[Proctoring] Cooldown active for ${eventType}, skipped logging.`);
    }
  }, [attemptId, addViolation]);

  useEffect(() => {
    if (!attemptId || !examId) return;

    if (!cameraActive) {
      if (proctoringStartedRef.current) {
         setMonitoringStatus('ERROR');
         setLastEvent('CAMERA_DISABLED');
         logEventIfReady('camera_disabled');
      }
      return;
    }

    if (!proctoringStartedRef.current) {
       proctoringStartedRef.current = true;
       logEventIfReady('proctoring_started');
    }

    setMonitoringStatus('ACTIVE');

    let isRequestPending = false;

    // Sub-second millisecond continuous proctoring loop (every 800ms)
    const interval = setInterval(async () => {
      if (isRequestPending) return;
      const frame = captureFrame();
      if (!frame) return;

      isRequestPending = true;
      try {
        const response = await biometricApi.analyzeFrame({ frame });
        setFacesDetected(response.face_count);
        setFramesAnalyzed(prev => prev + 1);
        if (response.head_pose) {
          // Apply Exponential Moving Average (EMA) smoothing for yaw and pitch
          const alpha = 0.5; // Smoothing factor (0 = ignore new, 1 = no smoothing)
          
          if (!smoothedHeadPoseRef.current) {
            smoothedHeadPoseRef.current = { yaw: response.head_pose.yaw, pitch: response.head_pose.pitch, roll: response.head_pose.roll };
          } else {
            smoothedHeadPoseRef.current = {
              yaw: smoothedHeadPoseRef.current.yaw * (1 - alpha) + response.head_pose.yaw * alpha,
              pitch: smoothedHeadPoseRef.current.pitch * (1 - alpha) + response.head_pose.pitch * alpha,
              roll: smoothedHeadPoseRef.current.roll * (1 - alpha) + response.head_pose.roll * alpha
            };
          }
          
          // Classify smoothed direction locally
          const sYaw = smoothedHeadPoseRef.current.yaw;
          const sPitch = smoothedHeadPoseRef.current.pitch;
          const sRoll = smoothedHeadPoseRef.current.roll;
          let smoothedDirection = 'FORWARD';
          
          const YAW_THRESHOLD = 15.0;
          const PITCH_UP_THRESHOLD = 15.0;
          const PITCH_DOWN_THRESHOLD = 12.0;
          const ROLL_THRESHOLD = 15.0;
          
          if (Math.abs(sYaw) > YAW_THRESHOLD || Math.abs(sPitch) > Math.max(PITCH_UP_THRESHOLD, PITCH_DOWN_THRESHOLD) || Math.abs(sRoll) > ROLL_THRESHOLD) {
            const maxVal = Math.max(Math.abs(sYaw), Math.abs(sPitch), Math.abs(sRoll));
            if (maxVal === Math.abs(sYaw)) {
              smoothedDirection = sYaw > 0 ? 'RIGHT' : 'LEFT';
            } else if (maxVal === Math.abs(sPitch)) {
              smoothedDirection = sPitch > 0 ? 'DOWN' : 'UP';
            } else {
              smoothedDirection = sRoll > 0 ? 'TILTED_RIGHT' : 'TILTED_LEFT';
            }
          }
          
          // Override the raw backend direction with the smoothed classification
          response.head_pose.direction = smoothedDirection;
          response.head_pose.yaw = parseFloat(sYaw.toFixed(1));
          response.head_pose.pitch = parseFloat(sPitch.toFixed(1));
          
          setHeadPose(response.head_pose);
        }
        
        if (response.eye_tracking) {
          setEyeTracking(response.eye_tracking);
        }
        
        if (response.objects) setDetectedObjects(response.objects);
        else setDetectedObjects([]);
        
        // Evaluate condition
        let currentViolations = new Set<string>();
        let currentEventData: Record<string, any> = {};
        
        if (response.status === 'CAMERA_ERROR') {
          currentViolations.add('camera_error');
        } else if (response.face_count === 0) {
          currentViolations.add('no_face');
          currentEventData['no_face'] = { face_count: 0 };
        } else if (response.face_count > 1) {
          currentViolations.add('multiple_faces');
          currentEventData['multiple_faces'] = { face_count: response.face_count };
        } else if (response.face_count === 1) {
          // Continuous Candidate Face Identity Match (Person Swap Detection)
          if (response.status === 'FACE_MISMATCH' || response.face_verified === false) {
            currentViolations.add('face_mismatch');
            currentEventData['face_mismatch'] = {
              similarity_score: response.similarity_score,
              reason: "Person in camera frame does not match candidate's registered profile"
            };
          }

          // Check eye gaze and head pose movement (Eye & Face Deviation)
          const isEyeOffCenter = response.eye_tracking && response.eye_tracking.gaze_direction !== 'CENTER';
          const isHeadOffCenter = response.head_pose && response.head_pose.direction !== 'FORWARD' && response.head_pose.direction !== 'UNKNOWN';

          if (isEyeOffCenter || isHeadOffCenter || response.status === 'LOOKING_AWAY') {
            currentViolations.add('looking_away');
            currentEventData['looking_away'] = {
              gaze_direction: response.eye_tracking?.gaze_direction || 'CENTER',
              gaze_offset_x: response.eye_tracking?.gaze_offset_x || 0,
              gaze_offset_y: response.eye_tracking?.gaze_offset_y || 0,
              head_direction: response.head_pose?.direction || 'FORWARD',
              yaw: response.head_pose?.yaw || 0,
              pitch: response.head_pose?.pitch || 0,
              roll: response.head_pose?.roll || 0,
              reason: isEyeOffCenter ? `Eye gaze shifted (${response.eye_tracking?.gaze_direction})` : `Head turned (${response.head_pose?.direction})`
            };
          }
        }
        
        // Check objects for cell phone / electronic devices
        const phoneObj = response.objects?.find(obj => {
          const l = obj.label.toLowerCase();
          return l.includes('phone') || l.includes('cell') || l === 'mobile phone' || l === 'cell phone' || l === 'telephone';
        });
        if (phoneObj) {
          currentViolations.add('phone_detected');
          currentEventData['phone_detected'] = {
            object: phoneObj.label,
            confidence: phoneObj.confidence,
            bounding_box: phoneObj.bounding_box
          };
        }

        if (currentViolations.size === 0) {
          consecutiveCountsRef.current = {};
          setMonitoringStatus('ACTIVE');
        } else {
          // Update consecutive counts
          for (const v of currentViolations) {
            consecutiveCountsRef.current[v] = (consecutiveCountsRef.current[v] || 0) + 1;
            
            // Immediate 1-frame trigger threshold for critical security events (face mismatch)
            const threshold = (v === 'face_mismatch' || v === 'phone_detected') ? 1 : 2;

            if (consecutiveCountsRef.current[v] >= threshold) {
               console.log(`[Proctoring] Violation confirmed: ${v}`);
               if (v === 'camera_error') {
                 setMonitoringStatus('CONNECTION WARNING');
               }
               logEventIfReady(v, currentEventData[v]);
            }
          }
          
          // Reset counts for violations that are no longer present
          for (const v in consecutiveCountsRef.current) {
            if (!currentViolations.has(v)) {
              delete consecutiveCountsRef.current[v];
            }
          }
        }

      } catch (err) {
        console.error("[Proctoring] Frame analysis error:", err);
        setMonitoringStatus('CONNECTION WARNING');
      } finally {
        isRequestPending = false;
      }
    }, 800); // 800ms sub-second millisecond continuous evaluation

    return () => clearInterval(interval);
  }, [examId, attemptId, cameraActive, captureFrame, logEventIfReady]);

  // Audio Monitoring Effect (Web Audio API AnalyserNode)
  useEffect(() => {
    if (!attemptId) return;

    let isSubscribed = true;

    const startAudioStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isSubscribed) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        audioStreamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioCtxRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const analyzeAudio = () => {
          if (!isSubscribed) return;

          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const avg = sum / bufferLength;
          const vol = Math.min(100, Math.round((avg / 128) * 100));
          setAudioVolume(vol);

          const now = Date.now();
          const threshold = 35; // 35% decibel threshold for speech/noise
          const sustainedMs = 2000; // Must be sustained for 2 seconds

          if (vol >= threshold) {
            if (!highNoiseStartTimeRef.current) {
              highNoiseStartTimeRef.current = now;
            } else if (now - highNoiseStartTimeRef.current >= sustainedMs) {
              setIsVoiceDetected(true);
              logEventIfReady('voice_detected', { volume: vol, threshold });
            }
          } else {
            highNoiseStartTimeRef.current = null;
            setIsVoiceDetected(false);
          }

          audioAnimFrameRef.current = requestAnimationFrame(analyzeAudio);
        };

        analyzeAudio();
      } catch (err) {
        console.warn("[Proctoring] Microphone access disabled or unavailable for continuous audio proctoring:", err);
      }
    };

    startAudioStream();

    return () => {
      isSubscribed = false;
      if (audioAnimFrameRef.current) {
        cancelAnimationFrame(audioAnimFrameRef.current);
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [attemptId, logEventIfReady]);

  return {
    monitoringStatus,
    facesDetected,
    framesAnalyzed,
    lastEvent,
    headPose,
    eyeTracking,
    detectedObjects,
    audioVolume,
    isVoiceDetected
  };
};
