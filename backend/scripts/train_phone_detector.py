import os
import argparse
from ultralytics import YOLO

def train_custom_model(
    model_path='yolov8s.pt', 
    data_yaml='../../datasets/phone_detection/data.yaml', 
    epochs=100, 
    imgsz=640, 
    batch_size=16, 
    device='', 
    project='runs/train', 
    name='examshield_phone_det',
    workers=8
):
    """
    Trains a custom YOLOv8 model for cell phone detection in ExamShield,
    with a strong emphasis on detecting partially occluded phones.
    """
    print(f"Loading base model: {model_path}")
    try:
        model = YOLO(model_path)
    except Exception as e:
        print(f"Error loading model {model_path}: {e}")
        return
    
    # Resolve absolute path to dataset
    dataset_config = os.path.abspath(os.path.join(os.path.dirname(__file__), data_yaml))
    if not os.path.exists(dataset_config):
        print(f"Error: Could not find dataset config at {dataset_config}")
        print("Please ensure the dataset structure and data.yaml exist.")
        return

    print("\nStarting ExamShield Custom Training Pipeline...")
    print("=========================================")
    print(f"Base Model: {model_path}")
    print(f"Dataset YAML: {dataset_config}")
    print(f"Epochs: {epochs}")
    print(f"Image Size: {imgsz}")
    print(f"Batch Size: {batch_size}")
    print(f"Device: {device if device else 'Auto'}")
    print(f"Workers: {workers}")
    print(f"Output Dir: {os.path.join(project, name)}")
    print("=========================================\n")
    
    # Train the model with specific augmentation hyperparameters for partial occlusion
    results = model.train(
        data=dataset_config,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch_size,
        device=device,
        project=project,
        name=name,
        workers=workers,
        
        # --- OCCLUSION-AWARE AUGMENTATIONS ---
        # Crucial for teaching the model that partially hidden phones are still phones.
        mosaic=1.0,         # Mixes 4 training images into one (context variation)
        mixup=0.1,          # Blends images slightly
        copy_paste=0.0,     # Disabled by default, but can be enabled if instance segmentation is used
        erasing=0.4,        # Random erasing (cutout) to artificially synthesize partial occlusion
        
        # --- GEOMETRIC AUGMENTATIONS ---
        degrees=15.0,       # Random rotation (phones can be tilted)
        scale=0.5,          # Random zoom out/in (phones can be close or far)
        translate=0.1,      # Random translation (phones partially out of frame)
        perspective=0.0001, # Slight perspective shift
        flipud=0.0,         # Don't flip upside down (unrealistic for exams)
        fliplr=0.5,         # Left-right flip is realistic
        
        # --- PHOTOMETRIC AUGMENTATIONS ---
        hsv_h=0.015,        # Hue adjustments
        hsv_s=0.7,          # Color saturation (helps with varied webcam quality)
        hsv_v=0.4,          # Brightness (helps with low light/backlight)
        bgr=0.0,            # BGR flip (leave 0)
        
        # --- OPTIMIZATION ---
        optimizer='auto',
        patience=20,        # Early stopping if no improvement over 20 epochs
        save=True,          # Save weights during training
        val=True            # Validate during training
    )
    
    print("\nTraining completed!")
    print(f"Your best weights are located at: {os.path.join(project, name, 'weights', 'best.pt')}")
    print("To integrate with the backend, edit app/core/config.py or set the environment variable:")
    print(f"OBJECT_MODEL_PATH={os.path.abspath(os.path.join(project, name, 'weights', 'best.pt'))}")
    print("OBJECT_CONFIDENCE_THRESHOLD=0.40")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Train ExamShield Custom Phone Detector')
    parser.add_argument('--model', type=str, default='yolov8s.pt', help='Path to base model (e.g. yolov8s.pt)')
    parser.add_argument('--data', type=str, default='../../datasets/phone_detection/data.yaml', help='Path to dataset YAML')
    parser.add_argument('--epochs', type=int, default=100, help='Number of training epochs')
    parser.add_argument('--imgsz', type=int, default=640, help='Image size')
    parser.add_argument('--batch', type=int, default=16, help='Batch size')
    parser.add_argument('--device', type=str, default='', help='Device (e.g. 0 for GPU, cpu for CPU)')
    parser.add_argument('--project', type=str, default='runs/train', help='Output project directory')
    parser.add_argument('--name', type=str, default='examshield_phone_det', help='Output run name')
    parser.add_argument('--workers', type=int, default=8, help='Number of dataloader workers')
    
    args = parser.parse_args()
    
    train_custom_model(
        model_path=args.model,
        data_yaml=args.data,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch_size=args.batch,
        device=args.device,
        project=args.project,
        name=args.name,
        workers=args.workers
    )
