class AIService:
    """
    Interface definitions for future AI integrations.
    This ensures that the authentication logic does not tightly couple with the AI engines.
    """
    
    def register_face(self, user_id: str, image_bytes: bytes) -> bool:
        # TODO: Send image to Face Registration Module
        raise NotImplementedError
        
    def verify_face(self, user_id: str, image_bytes: bytes) -> float:
        # TODO: Send image to Face Recognition Module
        raise NotImplementedError
        
    def detect_phone(self, frame_bytes: bytes) -> bool:
        # TODO: Run object detection model
        raise NotImplementedError
        
    def analyse_behaviour(self, video_feed) -> dict:
        # TODO: Combine eye gaze, head pose, and multiple person detection
        raise NotImplementedError
