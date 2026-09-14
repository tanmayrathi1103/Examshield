import os
import argparse
from ultralytics import YOLO

def evaluate_occlusion(model_path, test_dir='../../datasets/phone_detection/test/occlusion'):
    print(f"Loading model from: {model_path}")
    try:
        model = YOLO(model_path)
    except Exception as e:
        print(f"Error loading model: {e}")
        return

    test_base = os.path.abspath(os.path.join(os.path.dirname(__file__), test_dir))
    categories = ['25_percent', '50_percent', '75_percent', 'hand_occlusion', 'partial_frame']

    print("\nStarting Occlusion Evaluation Pipeline...")
    print("=========================================")

    results_summary = {}

    for cat in categories:
        cat_dir = os.path.join(test_base, cat)
        if not os.path.exists(cat_dir):
            print(f"Warning: Directory not found for category {cat}: {cat_dir}")
            continue

        print(f"\nEvaluating category: {cat}")
        
        # We need a temporary data.yaml for this category since YOLO.val() requires a yaml
        yaml_content = f"""
train: {cat_dir}/images
val: {cat_dir}/images
nc: 1
names: ['cell_phone']
"""
        yaml_path = os.path.join(cat_dir, 'data_eval.yaml')
        with open(yaml_path, 'w') as f:
            f.write(yaml_content.strip())

        try:
            metrics = model.val(data=yaml_path, split='val', imgsz=640, device='')
            
            # Extract mAP50 and mAP50-95
            map50 = metrics.box.map50
            map50_95 = metrics.box.map
            
            results_summary[cat] = {
                'mAP@50': float(map50),
                'mAP@50-95': float(map50_95)
            }
            
            print(f"Category {cat} Results: mAP@50 = {map50:.4f}, mAP@50-95 = {map50_95:.4f}")
        except Exception as e:
            print(f"Error evaluating category {cat}: {e}")

    print("\n=========================================")
    print("FINAL OCCLUSION METRICS SUMMARY")
    print("=========================================")
    for cat, mets in results_summary.items():
        print(f"{cat.ljust(20)} | mAP@50: {mets['mAP@50']:.4f} | mAP@50-95: {mets['mAP@50-95']:.4f}")
    
    print("\nEvaluation Complete.")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', type=str, default='runs/train/examshield_phone_det/weights/best.pt')
    parser.add_argument('--test_dir', type=str, default='../../datasets/phone_detection/test/occlusion')
    args = parser.parse_args()
    
    evaluate_occlusion(args.model, args.test_dir)
