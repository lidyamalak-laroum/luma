# LUMA — Plant Disease Detector 🌿

LUMA is a mobile-first web app that uses AI to identify plant diseases from leaf photos and provide actionable treatment advice.

> For best results, photograph a single leaf on a plain background in good lighting.

---

## Features

- Email/password auth with email verification — powered by Firebase
- AI disease detection across 38 plant disease classes
- Treatment advice for every detected disease
- Scan history with thumbnail previews, saved to Firestore
- Mobile-first UI designed for real field use

---

## Project Structure

```
luma/
├── Backend/
│   ├── src/
│   │   ├── app.js                   # Express app (middleware + routes)
│   │   ├── server.js                # Entry point
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   └── scan.routes.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   └── scan.controller.js   # Hugging Face Inference API call
│   │   └── services/
│   │       └── mailer.service.js
│   ├── uploads/                     # Temp uploaded images (git-ignored)
│   ├── .env                         # Secrets — never commit!
│   └── package.json
│
└── Frontend/
    ├── index.html
    ├── css/
    │   ├── style.css                # Design tokens, reset, layout
    │   ├── components.css           # Buttons, forms, navbar
    │   └── views.css                # Per-view styles
    └── js/
        ├── main.js                  # App bootstrap + auth listener
        ├── router.js                # View router
        ├── diseaseAdvice.js         # Fuzzy keyword advice matching
        ├── firebase.config.js
        ├── firebase.init.js
        ├── views/
        │   ├── login.js
        │   ├── register.js
        │   ├── verify.js
        │   ├── home.js              # Scan flow + result card
        │   ├── history.js           # Scan history view
        │   └── settings.js
        └── services/
            ├── auth.service.js
            ├── api.service.js       # Backend fetch calls
            └── scan.service.js      # Firestore save + base64 compression
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project (Auth + Firestore enabled)
- A Hugging Face account and API token → [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

### Backend

```bash
cd Backend
npm install
npm start
```

The server starts on **http://localhost:5000**.

### Frontend

Open `Frontend/index.html` directly in your browser, or serve with any static server:

```bash
npx serve Frontend
```

### Environment Variables

```env
HF_API_KEY=your_huggingface_token_here
PORT=5000
```

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/scan` | Upload leaf image → returns disease prediction |
| POST | `/api/auth/send-code` | Send email verification code |
| POST | `/api/auth/verify-code` | Verify submitted code |
| GET | `/` | Health check |

---

## ML Model

Uses [`linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification`](https://huggingface.co/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification) via the Hugging Face Inference API — a MobileNetV2 fine-tuned on the PlantVillage dataset covering **38 disease classes** across 14 crop types.

---

## Key Technical Decisions

**No Firebase Storage** — The project region didn't support free-tier Storage buckets. Leaf images are instead compressed client-side to a base64 JPEG thumbnail (300px, 70% quality) using the Canvas API and stored directly in Firestore. Zero extra infrastructure needed.

**Fuzzy Advice Matching** — Different model versions return labels in different formats (`Tomato___Early_blight` vs `Tomato with Early Blight`). The advice lookup normalises labels and matches against keyword arrays, making it resilient to any future model or format changes.

---

## Deployment

| Layer | Platform |
|---|---|
| Frontend | [Vercel](https://vercel.com) |
| Backend | [Railway](https://railway.app) |

---

<div align="center">
  Built by <a href="https://github.com/lidyamalak-laroum">lidyamalak-laroum</a>
</div>
