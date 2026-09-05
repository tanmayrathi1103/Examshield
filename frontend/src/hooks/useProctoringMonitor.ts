import { useState, useEffect, useRef, useCallback } from 'react';
import { biometricApi } from '../api/biometrics';
import { attemptsApi } from '../api/attempts';
import { useApp } from '../context/AppContext';
import type { HeadPose, DetectedObject } from '../types';

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
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);

  // Debounce tracking (scaled to track multiple simultaneous violations)
  const consecutiveCountsRef = useRef<{ [key: string]: number }>({});
  
  // Smoothing history for head pose
  const smoothedHeadPoseRef = useRef<{ yaw: number, pitch: number, roll: number } | null>(null);
  
  // Cooldown tracking (60s)
  const lastEventTimeRef = useRef<{ [key: string]: number }>({});
  
  // Track if proctoring started
  const proctoringStartedRef = useRef(false);

  const logEventIfReady = useCallback(async (eventType: string, eventData: any = {}) => {
    if (!attemptId) return;
    
    const now = Date.now();
    const lastTime = lastEventTimeRef.current[eventType] || 0;
    
    if (now - lastTime > 60000) {
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
          addViolation("Face Missing", "high");
        } else if (eventType === 'multiple_faces') {
          addViolation("Multiple Faces", "high");
        } else if (eventType === 'looking_away') {
          addViolation("Looking Away", "medium");
        } else if (eventType === 'phone_detected') {
          addViolation("Phone Detected", "high");
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

    const interval = setInterval(async () => {
      if (isRequestPending) return;
      const frame = captureFrame();
      if (!frame) return;

      isRequestPending = true;
      try {
        console.log("[Proctoring] Sending frame for analysis");
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
          let smoothedDirection = 'FORWARD';
          
          const YAW_THRESHOLD = 20.0;
          const PITCH_UP_THRESHOLD = 20.0;
          const PITCH_DOWN_THRESHOLD = 15.0;
          
          if (Math.abs(sYaw) > YAW_THRESHOLD || Math.abs(sPitch) > Math.max(PITCH_UP_THRESHOLD, PITCH_DOWN_THRESHOLD)) {
            if (Math.abs(sYaw) > Math.abs(sPitch)) {
              smoothedDirection = sYaw > 0 ? 'RIGHT' : 'LEFT';
            } else {
              smoothedDirection = sPitch > 0 ? 'DOWN' : 'UP';
            }
          }
          
          // Override the raw backend direction with the smoothed classification
          response.head_pose.direction = smoothedDirection;
          response.head_pose.yaw = parseFloat(sYaw.toFixed(1));
          response.head_pose.pitch = parseFloat(sPitch.toFixed(1));
          
          setHeadPose(response.head_pose);
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
          // Check head pose
          if (response.head_pose && response.head_pose.direction !== 'FORWARD' && response.head_pose.direction !== 'UNKNOWN') {
            currentViolations.add('looking_away');
            currentEventData['looking_away'] = {
              direction: response.head_pose.direction,
              yaw: response.head_pose.yaw,
              pitch: response.head_pose.pitch,
              roll: response.head_pose.roll
            };
          }
        }
        
        // Check objects
        const phoneObj = response.objects?.find(obj => obj.label === 'cell phone');
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
            
            // Trigger based on configurable threshold or default to 2
            const threshold = v === 'phone_detected' 
                ? Number(import.meta.env.VITE_OBJECT_TEMPORAL_CONFIRMATION_FRAMES || 2) 
                : 2;

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
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [examId, attemptId, cameraActive, captureFrame, logEventIfReady]);

  return {
    monitoringStatus,
    facesDetected,
    framesAnalyzed,
    lastEvent,
    headPose,
    detectedObjects
  };
};
