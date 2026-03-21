# NexusAI — Python + React 

A full-stack AI chatbot built with:
- **FastAPI** (Python) backend
- **React + Vite** frontend
- Chat history saved in browser
- 4 modes: Chat, Study, Research, Docs
- PDF/TXT upload & Q&A
- Image input (vision)
- Voice input

---

## 🚀 How to Run

### Step 1 — Get FREE Gemini API Key
1. Go to https://aistudio.google.com
2. Sign in with Google
3. Click "Get API Key" → "Create API key"
4. Copy the key (starts with gsk...)

### Step 2 — Add your key
Open `backend/.env` and paste:
```
GROQ_API_KEY=gsk-your-key-here
```

### Step 3 — Run

python app.py


Browser opens automatically at http://localhost:5173

Press **Ctrl+C** to stop.

---

## 📁 Structure
```
nexusai/
├── app.py              ← Run this!
├── backend/
│   ├── main.py         ← Gemini API logic
│   ├── requirements.txt
│   └── .env            ← Your API key goes here
└── frontend/
    └── src/
        ├── App.jsx
        ├── api.js
        ├── useHistory.js
        └── components/
```

---

## Requirements
- Python 3.8+  → https://python.org
- Node.js      → https://nodejs.org
