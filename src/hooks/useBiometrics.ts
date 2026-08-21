import { useState, useRef, useCallback, useEffect } from 'react';
import { biometricApi } from '../api/biometrics';
import type { BiometricStatusResponse } from '../types';

const extractErrorMessage = (err: any, fallback: string): string => {
  const detail = err.response?.data?.detail;
  if (!detail) return err.message || fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d: any) => d.msg || (typeof d === 'string' ? d : JSON.stringify(d))).join(', ');
  }
  if (typeof detail === 'object') {
    return detail.msg || detail.message || JSON.stringify(detail);
  }
  return String(detail);
};

export const useBiometrics = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<BiometricStatusResponse | null>(null);
  const [retriesLeft, setRetriesLeft] = useState(5);
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);



  // Robust binder to bind stream to video element when ready
  useEffect(() => {
    if (videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(err => {
        if (err.name !== 'AbortError') {
          console.error("Error playing video stream:", err);
        }
      });
    }
  });

  // Initialize and start camera feed
  const startCamera = useCallback(async () => {
    console.log("startCamera hook method called.");
    console.log("Browser context security checks: window.isSecureContext =", window.isSecureContext);
    console.log("navigator.mediaDevices existence:", !!navigator.mediaDevices);
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("navigator.mediaDevices or getUserMedia is undefined. Ensure this page is running under a secure context (e.g. http://localhost:5173 or HTTPS).");
      }
      if (streamRef.current) {
        console.log("Stopping existing stream tracks before starting a new one.");
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      console.log("Requesting getUserMedia camera stream...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      console.log("getUserMedia successfully returned MediaStream:", stream);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
          console.log("Webcam video element playback initiated successfully.");
        } catch (playErr: any) {
          if (playErr.name === 'AbortError') {
            console.log("Play request interrupted by a new load request (harmless AbortError).");
          } else {
            throw playErr;
          }
        }
      } else {
        console.log("videoRef.current is not bound yet. Binding will occur automatically in the layout effect.");
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error("Camera access failed inside hook:", err);
      const msg = err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access in browser settings.'
        : `Failed to access camera device: ${err.message || err.name || err}`;
      setCameraError(msg);
      setCameraActive(false);
    }
  }, []);

  // Stop camera feed cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Clean up tracks on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Capture single frame as base64 JPEG
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !cameraActive) return null;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, [cameraActive]);



  // Register biometrics
  const registerFace = useCallback(async (consent: boolean, overrideReRegister: boolean = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const frame = captureFrame();
      if (!frame) {
        throw new Error('Could not capture frame from webcam. Please check camera feed.');
      }
      const response = await biometricApi.register({
        image_base64: frame,
        consent,
        override_re_register: overrideReRegister
      });
      await fetchStatus();
      return response;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Biometric registration failed');
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [captureFrame]);

  // Verify biometrics (Stateless integration)
  const verifyFace = useCallback(async (examId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const primaryFrame = captureFrame();
      if (!primaryFrame) {
        throw new Error('Camera feed unavailable for capture.');
      }

      const response = await biometricApi.verify({
        image_base64: primaryFrame,
        liveness_frames: [],
        exam_id: examId
      });

      setSimilarityScore(response.similarity_score);
      setRetriesLeft(response.retries_left);
      if (!response.verified) {
        setError(response.message);
      }
      return response;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Biometric verification failed');
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [captureFrame]);

  // Fetch status
  const fetchStatus = useCallback(async () => {
    try {
      const status = await biometricApi.getStatus();
      setEnrollmentStatus(status);
      return status;
    } catch {
      return null;
    }
  }, []);

  // Delete biometric data (GDPR Right to Erasure)
  const deleteBiometrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await biometricApi.deleteMyData();
      await fetchStatus();
      return response;
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to erase biometric data');
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [fetchStatus]);

  return {
    videoRef,
    cameraActive,
    cameraError,
    isLoading,
    error,
    setError,
    enrollmentStatus,
    retriesLeft,
    similarityScore,
    startCamera,
    stopCamera,
    captureFrame,
    registerFace,
    verifyFace,
    fetchStatus,
    deleteBiometrics
  };
};
