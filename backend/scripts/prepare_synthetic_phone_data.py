import os
import cv2
import numpy as np
import random
import uuid
import shutil

# Paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../datasets/phone_detection'))
IMG_DIR = os.path.join(BASE_DIR, 'images')
LBL_DIR = os.path.join(BASE_DIR, 'labels')
TEST_OCCLUSION_DIR = os.path.join(BASE_DIR, 'test/occlusion')

# Create directories
for split in ['train', 'val', 'test']:
    os.makedirs(os.path.join(IMG_DIR, split), exist_ok=True)
    os.makedirs(os.path.join(LBL_DIR, split), exist_ok=True)

for category in ['25_percent', '50_percent', '75_percent', 'hand_occlusion', 'partial_frame']:
    os.makedirs(os.path.join(TEST_OCCLUSION_DIR, category), exist_ok=True)

def generate_sample(img_path, lbl_path, occlusion_type=None):
    W, H = 640, 640
    # Random background (noisy)
    bg_color = np.random.randint(50, 200, (1, 1, 3), dtype=np.uint8)
    img = np.tile(bg_color, (H, W, 1))
    noise = np.random.randint(-20, 20, (H, W, 3), dtype=np.int16)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # Phone properties
    pw, ph = random.randint(60, 150), random.randint(120, 300)
    
    # Allow partial out of frame
    if occlusion_type == 'partial_frame':
        px = random.choice([random.randint(-pw//2, 0), random.randint(W-pw//2, W)])
        py = random.choice([random.randint(-ph//2, 0), random.randint(H-ph//2, H)])
    else:
        px = random.randint(pw, W - pw)
        py = random.randint(ph, H - ph)

    # Mask to compute exact visible bounds
    phone_mask = np.zeros((H, W), dtype=np.uint8)
    
    phone_rect = [max(0, px), max(0, py), min(W, px+pw), min(H, py+ph)]
    
    if phone_rect[2] > phone_rect[0] and phone_rect[3] > phone_rect[1]:
        cv2.rectangle(phone_mask, (phone_rect[0], phone_rect[1]), (phone_rect[2], phone_rect[3]), 1, -1)
        phone_color = np.random.randint(20, 100, (3,)).tolist()
        cv2.rectangle(img, (phone_rect[0], phone_rect[1]), (phone_rect[2], phone_rect[3]), phone_color, -1)

    # Occlusions
    if occlusion_type in ['hand_occlusion', '25_percent', '50_percent', '75_percent'] or (occlusion_type is None and random.random() < 0.7):
        # Draw random polygons to simulate hands/objects
        num_occlusions = random.randint(1, 3)
        if occlusion_type == '75_percent':
            num_occlusions = 3 # More occlusions
            
        for _ in range(num_occlusions):
            ox = random.randint(phone_rect[0] - 50, phone_rect[2])
            oy = random.randint(phone_rect[1] - 50, phone_rect[3])
            ow = random.randint(30, pw + 50)
            oh = random.randint(30, ph + 50)
            
            # 75 percent occlusion means we cover most of the phone
            if occlusion_type == '75_percent':
                ow = pw
                oh = int(ph * 0.75)
                ox = phone_rect[0]
                oy = phone_rect[1]
            elif occlusion_type == '50_percent':
                ow = pw
                oh = int(ph * 0.5)
                ox = phone_rect[0]
                oy = phone_rect[1]
            elif occlusion_type == '25_percent':
                ow = pw
                oh = int(ph * 0.25)
                ox = phone_rect[0]
                oy = phone_rect[1]

            pts = np.array([
                [ox, oy],
                [ox + ow, oy + random.randint(-20, 20)],
                [ox + ow + random.randint(-20, 20), oy + oh],
                [ox + random.randint(-20, 20), oy + oh]
            ], np.int32)
            pts = pts.reshape((-1, 1, 2))
            
            occ_color = np.random.randint(150, 255, (3,)).tolist() # Hand-ish color
            cv2.fillPoly(phone_mask, [pts], 0)
            cv2.fillPoly(img, [pts], occ_color)

    # Calculate visible bounding box from mask
    y_idx, x_idx = np.where(phone_mask == 1)
    
    if len(x_idx) > 20: # Minimum visible pixels to be considered a phone
        x_min, x_max = np.min(x_idx), np.max(x_idx)
        y_min, y_max = np.min(y_idx), np.max(y_idx)
        
        # YOLO format: class x_center y_center width height (normalized)
        x_center = ((x_min + x_max) / 2.0) / W
        y_center = ((y_min + y_max) / 2.0) / H
        bbox_w = (x_max - x_min) / float(W)
        bbox_h = (y_max - y_min) / float(H)
        
        with open(lbl_path, 'w') as f:
            f.write(f"0 {x_center} {y_center} {bbox_w} {bbox_h}\n")
            
        # Draw bbox for debugging (if we want)
        # cv2.rectangle(img, (x_min, y_min), (x_max, y_max), (0, 255, 0), 2)
    else:
        # Empty label file for negative samples or fully occluded
        with open(lbl_path, 'w') as f:
            pass

    cv2.imwrite(img_path, img)


def main():
    print("Generating Synthetic Phone Detection Dataset...")
    total_images = 2500
    
    train_count = int(total_images * 0.7)
    val_count = int(total_images * 0.2)
    test_count = total_images - train_count - val_count

    splits = [('train', train_count), ('val', val_count), ('test', test_count)]
    
    for split_name, count in splits:
        print(f"Generating {count} images for {split_name}...")
        for i in range(count):
            file_id = str(uuid.uuid4())[:8]
            img_path = os.path.join(IMG_DIR, split_name, f"{file_id}.jpg")
            lbl_path = os.path.join(LBL_DIR, split_name, f"{file_id}.txt")
            generate_sample(img_path, lbl_path)

    print("Generating Occlusion Test Set...")
    occlusion_types = ['25_percent', '50_percent', '75_percent', 'hand_occlusion', 'partial_frame']
    for occ_type in occlusion_types:
        print(f"Generating 50 images for {occ_type}...")
        for i in range(50):
            file_id = str(uuid.uuid4())[:8]
            
            cat_dir = os.path.join(TEST_OCCLUSION_DIR, occ_type)
            # Create a YOLO compliant structure inside each occlusion test folder
            os.makedirs(os.path.join(cat_dir, 'images'), exist_ok=True)
            os.makedirs(os.path.join(cat_dir, 'labels'), exist_ok=True)
            
            img_path = os.path.join(cat_dir, 'images', f"{file_id}.jpg")
            lbl_path = os.path.join(cat_dir, 'labels', f"{file_id}.txt")
            
            generate_sample(img_path, lbl_path, occlusion_type=occ_type)

    print("Generation complete!")

if __name__ == '__main__':
    main()
