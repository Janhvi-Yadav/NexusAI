from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from groq import Groq
import os

app = FastAPI(title="NexusAI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPTS = {
    "chat":  "You are a helpful, friendly AI assistant. Answer clearly and conversationally.",
    "study": "You are a patient study tutor. Explain concepts step-by-step with examples, analogies, and memory tips. End with a quiz question when appropriate.",
    "web":   "You are a research assistant. Provide thorough, well-structured answers with relevant facts and cite sources where useful.",
    "doc":   "You are a document analyst. Answer questions strictly based on the document content provided by the user.",
}

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    mode: str = "chat"
    pdf_text: Optional[str] = None
    pdf_name: Optional[str] = None
    image_base64: Optional[str] = None
    image_type: Optional[str] = None

@app.get("/")
def root():
    return {"status": "NexusAI backend running", "provider": "Groq (Free)"}

@app.post("/chat")
def chat(req: ChatRequest):
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not set")

    client = Groq(api_key=api_key)
    system = SYSTEM_PROMPTS.get(req.mode, SYSTEM_PROMPTS["chat"])

    api_messages = [{"role": "system", "content": system}]

    for i, msg in enumerate(req.messages):
        if msg.role == "user" and i == len(req.messages) - 1:
            text = msg.content
            if req.mode == "doc" and req.pdf_text:
                text += f"\n\n[Document: {req.pdf_name or 'file'}]\n{req.pdf_text}"
            api_messages.append({"role": "user", "content": text})
        else:
            api_messages.append({"role": msg.role, "content": msg.content or ""})

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=api_messages,
            max_tokens=1500,
        )
        reply = response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"reply": reply}

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    content = await file.read()
    try:
        text = content.decode("utf-8", errors="ignore")
    except Exception:
        text = "[Could not parse file]"
    return {"text": text[:14000], "name": file.filename}