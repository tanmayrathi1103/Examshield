import cv2
import numpy as np
import math

def test_pose(face_points_2d, w=640, h=480):
    model_points = np.array([
        [-34.0, -34.0, 34.0],      # Right eye (subject's right, viewer's left)
        [34.0, -34.0, 34.0],       # Left eye (subject's left, viewer's right)
        [0.0, 0.0, 0.0],           # Nose tip
        [-30.0, 30.0, 34.0],       # Right mouth corner
        [30.0, 30.0, 34.0]         # Left mouth corner
    ], dtype=np.float32)
    
    image_points = np.array(face_points_2d, dtype=np.float32)
    
    focal_length = w
    center = (w / 2, h / 2)
    camera_matrix = np.array([
        [focal_length, 0, center[0]],
        [0, focal_length, center[1]],
        [0, 0, 1]
    ], dtype=np.float32)
    
    dist_coeffs = np.zeros((4, 1))
    success, rotation_vector, translation_vector = cv2.solvePnP(
        model_points, image_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_SQPNP
    )
    
    rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
    proj_matrix = np.hstack((rotation_matrix, translation_vector))
    euler_angles = cv2.decomposeProjectionMatrix(proj_matrix)[6]
    
    pitch, yaw, roll = float(euler_angles[0][0]), float(euler_angles[1][0]), float(euler_angles[2][0])
    
    print(f"Yaw: {yaw:.1f}, Pitch: {pitch:.1f}, Roll: {roll:.1f}")

print("Test 1: Forward")
test_pose([
    [270, 200], # Right eye (viewer left)
    [370, 200], # Left eye (viewer right)
    [320, 250], # Nose
    [280, 300], # Right mouth
    [360, 300]  # Left mouth
])

print("\nTest 2: Looking Left (Subject's Left / Viewer's Right) - Nose shifts right")
test_pose([
    [290, 200], 
    [380, 200], 
    [350, 250], # Nose shifts right
    [300, 300],
    [370, 300]
])

print("\nTest 3: Looking Right (Subject's Right / Viewer's Left) - Nose shifts left")
test_pose([
    [260, 200], 
    [350, 200], 
    [290, 250], # Nose shifts left
    [270, 300],
    [340, 300]
])

print("\nTest 4: Looking Down - Nose shifts down")
test_pose([
    [270, 200], 
    [370, 200], 
    [320, 280], # Nose shifts down
    [280, 310], 
    [360, 310]  
])

print("\nTest 5: Looking Up - Nose shifts up")
test_pose([
    [270, 200], 
    [370, 200], 
    [320, 220], # Nose shifts up
    [280, 300], 
    [360, 300]  
])
