export interface BiometricRegisterRequest {
  image_base64: string;
  consent: boolean;
  override_re_register?: boolean;
}

export interface BiometricRegisterResponse {
  success: boolean;
  message: string;
  quality_score: number;
  registered_at: string;
}

export interface BiometricVerifyRequest {
  image_base64: string;
  liveness_frames?: string[];
  exam_id?: string;
}

export interface BiometricVerifyResponse {
  verified: boolean;
  similarity_score: number;
  match_threshold: number;
  retries_left: number;
  message: string;
  locked_until?: string;
}

export interface BiometricStatusResponse {
  is_registered: boolean;
  registered_at?: string;
  quality_score?: number;
  consent_given?: boolean;
  key_version?: string;
}

export interface BiometricDeleteResponse {
  success: boolean;
  message: string;
  erased_at: string;
}

export interface BiometricAnalyzeFrameRequest {
  frame: string;
}

export interface HeadPose {
  yaw: number;
  pitch: number;
  roll: number;
  direction: string;
}

export interface EyeTrackingInfo {
  gaze_direction: string;
  gaze_offset_x: number;
  gaze_offset_y: number;
  eyes_visible: boolean;
}

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface DetectedObject {
  label: string;
  confidence: number;
  bounding_box: BoundingBox;
}

export interface BiometricAnalyzeFrameResponse {
  face_count: number;
  status: string;
  head_pose?: HeadPose;
  eye_tracking?: EyeTrackingInfo;
  objects?: DetectedObject[];
  face_verified?: boolean;
  similarity_score?: number;
}
