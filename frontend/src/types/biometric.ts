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
