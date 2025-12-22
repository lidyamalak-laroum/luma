import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import json
import sys
import os

# --- CLASS MAPPING ---
class_to_idx = {
    "Apple___Apple_scab": 0,
    "Apple___Black_rot": 1,
    "Apple___Cedar_apple_rust": 2,
    "Apple___healthy": 3,
    "Blueberry___healthy": 4,
    "Cherry___Powdery_mildew": 5,
    "Cherry___healthy": 6,
    "Corn___Gray_leaf_spot": 7,
    "Corn___Common_rust": 8,
    "Corn___Northern_Leaf_Blight": 9,
    "Corn___healthy": 10,
    "Grape___Black_rot": 11,
    "Grape___Esca": 12,
    "Grape___Leaf_blight": 13,
    "Grape___healthy": 14,
    "Orange___Citrus_greening": 15,
    "Peach___Bacterial_spot": 16,
    "Peach___healthy": 17,
    "Pepper___Bacterial_spot": 18,
    "Pepper___healthy": 19,
    "Potato___Early_blight": 20,
    "Potato___Late_blight": 21,
    "Potato___healthy": 22,
    "Raspberry___healthy": 23,
    "Soybean___healthy": 24,
    "Squash___Powdery_mildew": 25,
    "Strawberry___Leaf_scorch": 26,
    "Strawberry___healthy": 27,
    "Tomato___Bacterial_spot": 28,
    "Tomato___Early_blight": 29,
    "Tomato___Late_blight": 30,
    "Tomato___Leaf_Mold": 31,
    "Tomato___Septoria_leaf_spot": 32,
    "Tomato___Spider_mites": 33,
    "Tomato___Target_Spot": 34,
    "Tomato___Yellow_Leaf_Curl_Virus": 35,
    "Tomato___Mosaic_virus": 36,
    "Tomato___healthy": 37
}

idx_to_class = {v: k for k, v in class_to_idx.items()}


# --- LOAD MODEL ---
def load_model():
    model = models.resnet18(weights=None)
    model.fc = nn.Linear(512, len(class_to_idx))

    # load checkpoint
    state = torch.load("plants9615_checkpoint.pth", map_location="cpu", weights_only=False)
    model.load_state_dict(state)

    model.eval()
    return model


model = load_model()


# --- TRANSFORM ---
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(
        [0.485, 0.456, 0.406],
        [0.229, 0.224, 0.225]
    )
])


# --- MAIN INFERENCE ---
if __name__ == "__main__":
    output = {}

    try:
        # image path from Node.js
        img_path = sys.argv[1]

        if not os.path.exists(img_path):
            raise FileNotFoundError("Image file not found: " + img_path)

        # open image
        image = Image.open(img_path).convert("RGB")
        img_tensor = transform(image).unsqueeze(0)

        # predict
        with torch.no_grad():
            logits = model(img_tensor)
            probs = torch.softmax(logits, dim=1)[0]

        # top 3 predictions
        top_probs, top_idxs = probs.topk(3)

        classes = [idx_to_class[i.item()] for i in top_idxs]
        probabilities = [round(float(p), 4) for p in top_probs]

        output = {
            "success": True,
            "predictions": [
                {"class": classes[0], "prob": probabilities[0]},
                {"class": classes[1], "prob": probabilities[1]},
                {"class": classes[2], "prob": probabilities[2]}
            ]
        }

    except Exception as e:
        output = {"success": False, "error": str(e)}

    # print only JSON (VERY IMPORTANT!)
    print(json.dumps(output))


