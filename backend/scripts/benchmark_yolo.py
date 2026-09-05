import time
import numpy as np
try:
    from ultralytics import YOLO
except ImportError:
    print("ultralytics not installed.")
    exit(1)

def benchmark(model_name, img_size=(640, 640), runs=20):
    print(f"\nBenchmarking {model_name} with size {img_size}")
    model = YOLO(model_name)
    # create a dummy image
    img = np.random.randint(0, 255, (img_size[1], img_size[0], 3), dtype=np.uint8)
    
    # warmup
    for _ in range(3):
        model.predict(source=img, verbose=False, imgsz=img_size[0])
        
    start_time = time.time()
    for _ in range(runs):
        model.predict(source=img, verbose=False, imgsz=img_size[0])
    end_time = time.time()
    
    avg_ms = ((end_time - start_time) / runs) * 1000
    print(f"Average inference time over {runs} runs: {avg_ms:.2f} ms")
    return avg_ms

if __name__ == "__main__":
    benchmark("yolov8n.pt", img_size=(640, 640))
    benchmark("yolov8s.pt", img_size=(640, 640))
    benchmark("yolov8s.pt", img_size=(480, 480))
