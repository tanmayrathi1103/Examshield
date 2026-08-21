import json
from typing import List, Optional, Tuple
from cryptography.fernet import Fernet, InvalidToken
from app.core.config import settings

class BiometricSecurity:
    """
    Cryptographic manager for at-rest encryption and decryption of biometric
    embeddings and optional audit thumbnail captures.
    
    Supports key versioning and key rotation.
    Raw embeddings and decrypted bytes are never exposed to logs.
    """
    
    _keys = {
        settings.BIOMETRIC_KEY_VERSION: settings.BIOMETRIC_ENCRYPTION_KEY
    }
    
    @classmethod
    def _get_cipher(cls, key_version: Optional[str] = None) -> Fernet:
        version = key_version or settings.BIOMETRIC_KEY_VERSION
        key = cls._keys.get(version) or settings.BIOMETRIC_ENCRYPTION_KEY
        return Fernet(key.encode('utf-8') if isinstance(key, str) else key)

    @classmethod
    def encrypt_image_base64(cls, base64_str: str, key_version: Optional[str] = None) -> Tuple[str, str]:
        """
        Encrypts a raw base64 image string wrapped in a metadata dictionary.
        Returns (encrypted_str, key_version).
        """
        version = key_version or settings.BIOMETRIC_KEY_VERSION
        cipher = cls._get_cipher(version)
        payload = {
            "model": "RawImage",
            "image_base64": base64_str
        }
        serialized = json.dumps(payload).encode('utf-8')
        encrypted = cipher.encrypt(serialized).decode('utf-8')
        return encrypted, version

    @classmethod
    def decrypt_image_base64(cls, encrypted_str: str, key_version: Optional[str] = None) -> str:
        """
        Decrypts an encrypted raw base64 image string and verifies it is the current model.
        Raises ValueError("MIGRATION_REQUIRED") if it belongs to an outdated model space (SFace or FaceNet).
        """
        cipher = cls._get_cipher(key_version)
        try:
            decrypted_bytes = cipher.decrypt(encrypted_str.encode('utf-8'))
            data = json.loads(decrypted_bytes.decode('utf-8'))
            
            # Legacy SFace templates were stored as raw lists
            if isinstance(data, list):
                raise ValueError("MIGRATION_REQUIRED")
                
            # Dictionary metadata checks
            if isinstance(data, dict):
                if data.get("model") != "RawImage":
                    raise ValueError("MIGRATION_REQUIRED")
                return data["image_base64"]
                
            raise ValueError("Invalid biometric template structure")
        except InvalidToken as e:
            raise ValueError(f"Decryption failed for biometric template (key version: {key_version})") from e

    @classmethod
    def encrypt_image(cls, image_bytes: bytes, key_version: Optional[str] = None) -> Tuple[str, str]:
        """
        Encrypts raw image bytes for audit storage with restricted access.
        """
        version = key_version or settings.BIOMETRIC_KEY_VERSION
        cipher = cls._get_cipher(version)
        encrypted = cipher.encrypt(image_bytes).decode('utf-8')
        return encrypted, version

    @classmethod
    def decrypt_image(cls, encrypted_str: str, key_version: Optional[str] = None) -> bytes:
        """
        Decrypts audit image bytes.
        """
        cipher = cls._get_cipher(key_version)
        return cipher.decrypt(encrypted_str.encode('utf-8'))
