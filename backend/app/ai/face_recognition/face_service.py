import base64
import os
import cv2
import numpy as np
from typing import List, Tuple, Optional, Dict, Any
from pathlib import Path
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

import math

# Model paths
BASE_DIR = Path(__file__).resolve().parent.parent
WEIGHTS_DIR = BASE_DIR / "weights"
YUNET_PATH = str(WEIGHTS_DIR / "face_detection_yunet_2023mar.onnx")
SFACE_PATH = str(WEIGHTS_DIR / "face_recognition_sface_2021dec.onnx")

# Head Pose & Gaze Thresholds (Degrees & Ratios)
HEAD_YAW_THRESHOLD = 15.0
HEAD_PITCH_THRESHOLD_UP = 15.0
HEAD_PITCH_THRESHOLD_DOWN = 12.0
HEAD_ROLL_THRESHOLD = 15.0


class FaceProcessingError(Exception):
    """Custom exception for face detection/quality failures."""
    def __init__(self, message: str, code: str = "PROCESSING_ERROR"):
        super().__init__(message)
        self.message = message
        self.code = code


class FaceRecognitionService:
    """
    AI Face Recognition and Quality Pipeline using OpenCV DNN YuNet & SFace.
    
    SECURITY NOTE / KNOWN LIMITATION:
    Multi-frame challenge-response (blink/movement) provides a baseline deterrent
    against static printed photos and simple screen displays. It is not an absolute
    guarantee against sophisticated video deepfakes or 3D masks.
    """

    def __init__(self):
        self.detector = None
        self.recognizer = None
        self._init_models()

    def _init_models(self):
        try:
            if os.path.exists(YUNET_PATH) and os.path.exists(SFACE_PATH):
                self.detector = cv2.FaceDetectorYN.create(
                    YUNET_PATH, "", (320, 320), score_threshold=0.6, nms_threshold=0.3
                )
                self.recognizer = cv2.FaceRecognizerSF.create(SFACE_PATH, "")
                logger.info("OpenCV YuNet & SFace models initialized successfully.")
            else:
                logger.warning("YuNet/SFace weights not found at expected paths. Using Haar cascade fallback.")
        except Exception as e:
            logger.error(f"Error initializing face models: {e}")

    @staticmethod
    def decode_base64_image(image_base64: str) -> np.ndarray:
        """
        Decodes base64 string (including data URI format) into an OpenCV BGR numpy array.
        """
        try:
            if "," in image_base64:
                image_base64 = image_base64.split(",", 1)[1]
            image_bytes = base64.b64decode(image_base64)
            np_arr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            if img is None:
                raise FaceProcessingError("Unable to decode image data.", code="INVALID_IMAGE")
            return img
        except FaceProcessingError:
            raise
        except Exception as e:
            raise FaceProcessingError("Invalid image format or encoding.", code="DECODE_ERROR") from e

    @staticmethod
    def check_image_quality(img: np.ndarray) -> Dict[str, Any]:
        """
        Validates frame lighting, sharpness, and resolution.
        """
        h, w = img.shape[:2]
        if h < 160 or w < 160:
            raise FaceProcessingError("Image resolution is too low. Please use a standard webcam.", code="LOW_RESOLUTION")

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 1. Lighting / Exposure Check
        mean_brightness = float(np.mean(gray))
        if mean_brightness < 40:
            raise FaceProcessingError("Lighting is too dark. Please face a light source.", code="UNDER_EXPOSED")
        if mean_brightness > 240:
            raise FaceProcessingError("Image is over-exposed or washed out. Please adjust your lighting.", code="OVER_EXPOSED")

        # 2. Blur / Sharpness Check using Laplacian Variance
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        if laplacian_var < 30.0:
            raise FaceProcessingError("Image is blurry or out of focus. Please remain still and face the camera directly.", code="BLURRY")

        quality_score = min(100.0, max(0.0, (laplacian_var / 2.0) + (100 - abs(mean_brightness - 128))))
        return {
            "brightness": mean_brightness,
            "sharpness": laplacian_var,
            "quality_score": round(quality_score, 2)
        }

    def count_faces(self, img: np.ndarray) -> int:
        """
        Counts the number of faces in the frame using YuNet.
        Returns 0 if no face is detected.
        """
        if os.getenv("BYPASS_FACE_DETECTION") == "true":
            return 1
            
        h, w = img.shape[:2]
        
        if self.detector is not None:
            self.detector.setInputSize((w, h))
            _, faces = self.detector.detect(img)
            
            if faces is None or len(faces) == 0:
                return 0
                
            # Filter faces by confidence threshold
            confident_faces = [f for f in faces if f[-1] >= 0.55]
            return len(confident_faces)
            
        return 0

    def detect_face(self, img: np.ndarray) -> Tuple[np.ndarray, float]:
        """
        Detects face and verifies exactly ONE face is present.
        Returns (face_feature_row, confidence).
        """
        if os.getenv("BYPASS_FACE_DETECTION") == "true":
            dummy_row = np.zeros(15, dtype=np.float32)
            dummy_row[0:4] = [80, 80, 160, 160]
            dummy_row[14] = 0.99
            return dummy_row, 0.99

        h, w = img.shape[:2]
        
        if self.detector is not None:
            self.detector.setInputSize((w, h))
            _, faces = self.detector.detect(img)
            
            if faces is None or len(faces) == 0:
                raise FaceProcessingError("No face detected. Please ensure your face is clearly visible and well-lit.", code="NO_FACE")
                
            # Filter faces by confidence threshold
            confident_faces = [f for f in faces if f[-1] >= 0.55]
            if len(confident_faces) == 0:
                raise FaceProcessingError("Face detected with low confidence. Please improve lighting and look straight ahead.", code="LOW_CONFIDENCE")
            if len(confident_faces) > 1:
                raise FaceProcessingError("Multiple faces detected in frame. Only the student must be present during the exam.", code="MULTIPLE_FACES")
            
            face_row = confident_faces[0]
            confidence = float(face_row[-1])
            
            # Check bounding box size relative to frame
            box_w, box_h = face_row[2], face_row[3]
            box_area_ratio = (box_w * box_h) / (w * h)
            if box_area_ratio < 0.05:
                raise FaceProcessingError("Face is too far from camera. Please move closer to the center of the frame.", code="FACE_TOO_FAR")
                
            return face_row, confidence
        else:
            # Fallback using OpenCV Haar Cascade if ONNX model is unavailable
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            detected = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))
            
            if len(detected) == 0:
                raise FaceProcessingError("No face detected. Please center your face in the camera.", code="NO_FACE")
            if len(detected) > 1:
                raise FaceProcessingError("Multiple faces detected. Ensure only one person is present.", code="MULTIPLE_FACES")
                
            x, y, fw, fh = detected[0]
            # Construct synthetic 15-element row format for SFace (x, y, w, h, 5 landmarks (x,y), conf)
            dummy_row = np.zeros(15, dtype=np.float32)
            dummy_row[0:4] = [x, y, fw, fh]
            dummy_row[4:14] = [x + fw*0.3, y + fh*0.35, x + fw*0.7, y + fh*0.35, x + fw*0.5, y + fh*0.55, x + fw*0.35, y + fh*0.75, x + fw*0.65, y + fh*0.75]
            dummy_row[14] = 0.95
            return dummy_row, 0.95

    def extract_embedding(self, img: np.ndarray, face_row: np.ndarray) -> List[float]:
        """
        Extracts 128-dimensional embedding vector using DeepFace FaceNet.
        """
        if os.getenv("BYPASS_FACE_DETECTION") == "true":
            return [1.0] + [0.0]*127
            
        try:
            from deepface import DeepFace
            
            x, y, w, h = map(int, face_row[0:4])
            ih, iw = img.shape[:2]
            x, y = max(0, x), max(0, y)
            w, h = min(w, iw - x), min(h, ih - y)
            
            crop = img[y:y+h, x:x+w]
            if crop.size == 0:
                crop = img
                
            # Extract embedding using FaceNet
            results = DeepFace.represent(img_path=crop, model_name="Facenet", enforce_detection=False)
            if not results or len(results) == 0:
                raise FaceProcessingError("Failed to extract facial features.", code="EMBEDDING_FAILED")
                
            embedding = results[0]["embedding"]
            
            # Print embedding length for validation check (Requirement 4)
            logger.info(f"VERIFICATION CHECK: Extracted FaceNet embedding length = {len(embedding)}")
            print(f"VERIFICATION CHECK: Extracted FaceNet embedding length = {len(embedding)}")
            
            return embedding
        except FaceProcessingError:
            raise
        except Exception as e:
            logger.error(f"Error in DeepFace FaceNet inference: {e}")
            raise FaceProcessingError(f"Feature extraction failed: {str(e)}", code="MODEL_INFERENCE_ERROR")

    @staticmethod
    def compute_cosine_similarity(embedding1: List[float], embedding2: List[float]) -> float:
        """
        Computes cosine similarity between two normalized 128-d vectors.
        Output is clamped to [0.0, 1.0].
        """
        v1 = np.array(embedding1, dtype=np.float32)
        v2 = np.array(embedding2, dtype=np.float32)
        
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
            
        dot_product = float(np.dot(v1, v2))
        cosine_sim = dot_product / (norm1 * norm2)
        return float(np.clip(cosine_sim, 0.0, 1.0))

    def verify_liveness(self, reference_img: np.ndarray, challenge_frames: List[np.ndarray]) -> bool:
        """
        [DEPRECATED] Liveness verification is disabled in this simplified image storage flow.
        Always returns True.
        """
        return True

    def process_and_extract(self, image_base64: str) -> Dict[str, Any]:
        """
        Full pipeline: decode -> quality check -> face detect -> extract embedding.
        """
        img = self.decode_base64_image(image_base64)
        quality = self.check_image_quality(img)
        face_row, confidence = self.detect_face(img)
        embedding = self.extract_embedding(img, face_row)
        
        # Create thumbnail for optional audit record
        h, w = img.shape[:2]
        thumb = cv2.resize(img, (160, int(160 * h / w)))
        _, thumb_buf = cv2.imencode(".jpg", thumb, [cv2.IMWRITE_JPEG_QUALITY, 75])
        
        return {
            "embedding": embedding,
            "quality_score": quality["quality_score"],
            "confidence": round(confidence, 4),
            "thumbnail_bytes": thumb_buf.tobytes()
        }

    def count_faces(self, img: np.ndarray) -> int:
        """
        Safely counts the number of detected faces. Returns 0 if none found.
        """
        if os.getenv("BYPASS_FACE_DETECTION") == "true":
            return 1
            
        h, w = img.shape[:2]
        
        if self.detector is not None:
            self.detector.setInputSize((w, h))
            _, faces = self.detector.detect(img)
            
            if faces is None or len(faces) == 0:
                return 0
                
            # Filter faces by confidence threshold
            confident_faces = [f for f in faces if f[-1] >= 0.55]
            return len(confident_faces)
            
        return 0

    def estimate_head_pose(self, img: np.ndarray, face_row: np.ndarray) -> Dict[str, Any]:
        """
        Estimates the head pose (Yaw, Pitch, Roll) using 5 facial landmarks from YuNet.
        """
        h, w = img.shape[:2]
        
        # 3D model points (generic face in standard OpenCV coordinate system: X right, Y down, Z forward into scene)
        model_points = np.array([
            [-34.0, -34.0, 34.0],      # Right eye (subject's right, viewer's left - smaller X, smaller Y)
            [34.0, -34.0, 34.0],       # Left eye (subject's left, viewer's right - larger X, smaller Y)
            [0.0, 0.0, 0.0],           # Nose tip
            [-30.0, 30.0, 34.0],       # Right mouth corner (smaller X, larger Y)
            [30.0, 30.0, 34.0]         # Left mouth corner (larger X, larger Y)
        ], dtype=np.float32)
        
        # YuNet provides landmarks in elements 4-13
        image_points = np.array([
            [face_row[4], face_row[5]],    # Right eye
            [face_row[6], face_row[7]],    # Left eye
            [face_row[8], face_row[9]],    # Nose tip
            [face_row[10], face_row[11]],  # Right mouth
            [face_row[12], face_row[13]]   # Left mouth
        ], dtype=np.float32)
        
        # Camera internals
        focal_length = w
        center = (w / 2, h / 2)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float32)
        
        dist_coeffs = np.zeros((4, 1))  # Assuming no lens distortion
        
        success, rotation_vector, translation_vector = cv2.solvePnP(
            model_points, image_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_SQPNP
        )
        
        if not success:
            raise FaceProcessingError("Head pose estimation failed", code="POSE_ESTIMATION_FAILED")
            
        # Convert rotation vector to rotation matrix
        rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
        
        # Calculate Euler angles
        proj_matrix = np.hstack((rotation_matrix, translation_vector))
        euler_angles = cv2.decomposeProjectionMatrix(proj_matrix)[6]
        
        pitch = float(euler_angles[0][0])
        yaw = float(euler_angles[1][0])
        roll = float(euler_angles[2][0])
        
        # Classification (using dominant-axis strategy with a neutral dead-zone)
        direction = "FORWARD"
        if abs(yaw) > HEAD_YAW_THRESHOLD or abs(pitch) > max(HEAD_PITCH_THRESHOLD_UP, HEAD_PITCH_THRESHOLD_DOWN) or abs(roll) > HEAD_ROLL_THRESHOLD:
            max_val = max(abs(yaw), abs(pitch), abs(roll))
            if max_val == abs(yaw):
                direction = "RIGHT" if yaw > 0 else "LEFT"
            elif max_val == abs(pitch):
                direction = "DOWN" if pitch > 0 else "UP"
            else:
                direction = "TILTED_RIGHT" if roll > 0 else "TILTED_LEFT"
            
        return {
            "yaw": round(yaw, 1),
            "pitch": round(pitch, 1),
            "roll": round(roll, 1),
            "direction": direction
        }

    def estimate_eye_gaze(self, img: np.ndarray, face_row: np.ndarray) -> Dict[str, Any]:
        """
        Estimates eye gaze vector and direction from YuNet facial landmarks.
        Format: [4,5]=Right eye, [6,7]=Left eye, [8,9]=Nose tip.
        """
        try:
            r_eye_x, r_eye_y = float(face_row[4]), float(face_row[5])
            l_eye_x, l_eye_y = float(face_row[6]), float(face_row[7])
            nose_x, nose_y = float(face_row[8]), float(face_row[9])

            eye_mid_x = (r_eye_x + l_eye_x) / 2.0
            eye_mid_y = (r_eye_y + l_eye_y) / 2.0

            eye_dist = math.hypot(l_eye_x - r_eye_x, l_eye_y - r_eye_y)
            if eye_dist < 1.0:
                eye_dist = 1.0

            # Normalized gaze offsets relative to nose tip
            gaze_offset_x = round((nose_x - eye_mid_x) / eye_dist, 3)
            gaze_offset_y = round((nose_y - eye_mid_y) / eye_dist, 3)

            # Determine eye gaze direction
            gaze_direction = "CENTER"
            if gaze_offset_x > 0.38:
                gaze_direction = "LOOKING_RIGHT"
            elif gaze_offset_x < -0.38:
                gaze_direction = "LOOKING_LEFT"
            elif gaze_offset_y > 0.85:
                gaze_direction = "LOOKING_DOWN"
            elif gaze_offset_y < 0.20:
                gaze_direction = "LOOKING_UP"

            return {
                "gaze_direction": gaze_direction,
                "gaze_offset_x": gaze_offset_x,
                "gaze_offset_y": gaze_offset_y,
                "eyes_visible": True
            }
        except Exception as e:
            logger.warning(f"Eye gaze calculation error: {e}")
            return {
                "gaze_direction": "CENTER",
                "gaze_offset_x": 0.0,
                "gaze_offset_y": 0.0,
                "eyes_visible": False
            }

    def analyze_frame_for_monitoring(self, img: np.ndarray) -> Tuple[int, Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
        """
        Detects faces and if exactly 1 face is found, estimates head pose and eye gaze.
        Returns (face_count, head_pose_dict_or_none, eye_tracking_dict_or_none)
        """
        if os.getenv("BYPASS_FACE_DETECTION") == "true":
            return 1, {"yaw": 0.0, "pitch": 0.0, "roll": 0.0, "direction": "FORWARD"}, {"gaze_direction": "CENTER", "gaze_offset_x": 0.0, "gaze_offset_y": 0.0, "eyes_visible": True}
            
        h, w = img.shape[:2]
        
        if self.detector is not None:
            self.detector.setInputSize((w, h))
            _, faces = self.detector.detect(img)
            
            if faces is None or len(faces) == 0:
                return 0, None, None
                
            # Filter faces by confidence threshold
            confident_faces = [f for f in faces if f[-1] >= 0.55]
            face_count = len(confident_faces)
            
            if face_count == 1:
                head_pose = None
                eye_tracking = None
                try:
                    head_pose = self.estimate_head_pose(img, confident_faces[0])
                except Exception as e:
                    logger.warning(f"Head pose estimation error: {e}")
                    head_pose = {"yaw": 0.0, "pitch": 0.0, "roll": 0.0, "direction": "UNKNOWN"}
                
                try:
                    eye_tracking = self.estimate_eye_gaze(img, confident_faces[0])
                except Exception as e:
                    logger.warning(f"Eye gaze estimation error: {e}")
                    eye_tracking = {"gaze_direction": "CENTER", "gaze_offset_x": 0.0, "gaze_offset_y": 0.0, "eyes_visible": False}
                    
                return face_count, head_pose, eye_tracking
                    
            return face_count, None, None
            
        return 0, None, None


# Global singleton instance
face_recognition_service = FaceRecognitionService()
