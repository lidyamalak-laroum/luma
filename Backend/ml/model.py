import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import json
import sys
import os

# --- CLASS MAPPING ---
# Load from the JSON file (single source of truth)
_dir = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(_dir, "class_to_idx.json"), "r") as f:
    class_to_idx = json.load(f)

idx_to_class = {v: k for k, v in class_to_idx.items()}


# --- LOAD MODEL ---
def load_model():
    model = models.resnet18(weights=None)
    model.fc = nn.Linear(512, len(class_to_idx))

    checkpoint_path = os.path.join(_dir, "plants9615_checkpoint.pth")
    state = torch.load(checkpoint_path, map_location="cpu", weights_only=False)
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
        img_path = sys.argv[1]

        if not os.path.exists(img_path):
            raise FileNotFoundError("Image file not found: " + img_path)

        image = Image.open(img_path).convert("RGB")
        img_tensor = transform(image).unsqueeze(0)

        with torch.no_grad():
            logits = model(img_tensor)
            probs = torch.softmax(logits, dim=1)[0]

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

    # IMPORTANT: Only print JSON stdout
    print(json.dumps(output))
