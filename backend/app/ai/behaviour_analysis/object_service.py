import logging
import numpy as np
import os
from typing import List, Dict, Any
import time

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None

from app.core.config import settings

logger = logging.getLogger(__name__)

class ObjectDetectionService:
    def __init__(self):
        self.model = None
        self._init_model()

    def _init_model(self):
        if YOLO is None:
            logger.warning("ultralytics not installed. Object detection disabled.")
            return
            
        # Load model from settings
        model_path = settings.OBJECT_MODEL_PATH
        
        try:
            logger.info(f"Initializing YOLO object detection model: {model_path}...")
            # Loads either the custom model or automatically downloads yolov8n.pt if not present
            self.model = YOLO(model_path)
            logger.info("YOLO model initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize YOLO model: {e}")

    def detect_objects(self, img: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detects objects in the image using YOLOv8.
        Returns a list of dictionaries with label, confidence, and bounding_box.
        Targeting 'cell phone' (class index 67 in COCO).
        """
        if self.model is None:
            return []
            
        target_label = os.getenv("CUSTOM_YOLO_CLASS_NAME", "cell phone")

        try:
            start_time = time.time()
            # Run inference
            # verbose=False prevents spamming stdout for every frame
            results = self.model.predict(
                source=img, 
                verbose=False,
                imgsz=settings.OBJECT_IMAGE_SIZE,
                conf=settings.OBJECT_CONFIDENCE_THRESHOLD,
                iou=settings.OBJECT_IOU_THRESHOLD,
                device=settings.OBJECT_DEVICE
            )
            
            detected_objects = []
            
            PHONE_LABELS = {
                "cell phone", "phone", "mobile phone", "telephone",
                "remote", "laptop", "book", "electronic device"
            }

            for result in results:
                boxes = result.boxes
                for box in boxes:
                    confidence = float(box.conf[0])
                    if confidence >= settings.OBJECT_CONFIDENCE_THRESHOLD:
                        class_id = int(box.cls[0])
                        raw_label = str(result.names[class_id])
                        label_lower = raw_label.lower()
                        
                        # We specifically flag cell phones and electronic devices
                        if label_lower in PHONE_LABELS or "phone" in label_lower or "cell" in label_lower or raw_label == target_label:
                            x1, y1, x2, y2 = map(int, box.xyxy[0])
                            detected_objects.append({
                                "label": raw_label,
                                "confidence": round(confidence, 2),
                                "bounding_box": {
                                    "x1": x1,
                                    "y1": y1,
                                    "x2": x2,
                                    "y2": y2
                                }
                            })
                            
            elapsed = int((time.time() - start_time) * 1000)
            if len(detected_objects) > 0:
                logger.info(f"[AI] Object detection: {elapsed}ms - Found {len(detected_objects)} cell phone(s)")
                
            return detected_objects
            
        except Exception as e:
            logger.warning(f"Error during object detection: {e}")
            return []

# Singleton instance
object_detection_service = ObjectDetectionService()
