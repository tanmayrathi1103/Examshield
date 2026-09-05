# ExamShield Mobile Phone Detection Dataset

This dataset is dedicated to training and fine-tuning YOLO models specifically for detecting mobile phones in an online examination context, particularly focusing on **partially occluded** phones.

## Data Collection Requirements

Target Size: **2,000–5,000 annotated images**. 
Diversity is prioritized over volume (do not just extract 1,000 frames from the same 1-minute video clip).

### Positive Samples (Cell Phones)
Ensure inclusion of the following scenarios:
1. **Fully Visible:** Phone is clear and fully inside the frame.
2. **Hand Occlusion:** 
   - 75% visible
   - 50% visible
   - 25% visible
3. **Phone Tilted:** Different rotation angles (flat on desk, held up, tilted).
4. **Phone Far From Camera:** Held at arm's length or in the background.
5. **Phone Close to Camera:** Filling a significant part of the frame.
6. **Phone Partially Out of Frame:** Truncated at the edge of the webcam view.
7. **Phone Near Face:** Held up to the ear or near the chin.
8. **Phone Near Chest:** Typical texting position under the desk line.
9. **Phone Near Desk:** Resting flat on a surface.
10. **Low Light:** Poorly illuminated rooms.
11. **Backlight:** Strong light source (window) behind the student.
12. **Blurry Webcam:** Low resolution or motion blur.
13. **Different Colors & Models:** iPhones, Androids, with and without cases.
14. **Different Backgrounds / Hand Positions / Camera Angles.**

### Negative Samples (To Suppress False Positives)
Images containing NO phones, but containing:
- Hands without phones (typing, resting)
- Calculators
- Notebooks and books
- Pens and pencils
- Laptops / Keyboards
- Tablets
- Wallets
- Remote controls
- Power banks
- Headphones cases
- Water bottles
- Glasses cases

## Annotation Rules

- **Format:** Standard YOLO format (`class x_center y_center width height`).
- **Classes:** Only one class is defined for this dataset.
  - `0: cell_phone`
- **Crucial Occlusion Rule:** Annotate ONLY the **visible** region of the phone. Do NOT draw the bounding box over the hand or object that is covering the phone. If a phone is split by a finger, draw the box encompassing the visible phone parts, but do not extend it to guess the invisible boundaries.

## Dataset Split (70/20/10)

- **Train (70%):** Used for model training.
- **Validation (20%):** Used during training to monitor overfitting and adjust hyperparameters.
- **Test (10%):** Used for final evaluation.

**Important Rule:** Do NOT randomly shuffle frames from the same continuous video clip into train and test splits. The test set MUST contain entirely distinct subjects, phones, backgrounds, and lighting conditions to accurately measure generalization.

## Occlusion Test Set

A dedicated test subset is available at `datasets/phone_detection/test/occlusion/` for evaluating performance under specific conditions.
Place test images into their respective folders (`75_percent`, `50_percent`, `25_percent`, `hand_occlusion`, `partial_frame`) to generate granular metrics later.

## How to Validate Labels

Use a script to visualize YOLO bounding boxes before training to ensure the "annotate only the visible region" rule was followed consistently.
