import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import google.generativeai as genai
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # ou ["*"] pour tout autoriser
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ---- CONFIG ----
PDF_DIR = "./data"
INDEX_PATH = "./faiss_index"
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
GEMINI_MODEL = "gemini-2.0-flash"

# ---- REQUEST/RESPONSE MODELS ----
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

# ---- CHATBOT CLASS ----
class GeminiChatBot:
    def __init__(self):
        self.history = []
        self.api_key = os.getenv("GEMINI_API_KEY")
        genai.configure(api_key=self.api_key)
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001", google_api_key=self.api_key
        )
        self.faiss_store = self._load_or_build_index()
        self.model = genai.GenerativeModel(
            model_name=GEMINI_MODEL,
            generation_config={
                "temperature": 0.3,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 2048,
                "response_mime_type": "text/plain"
            }
        )

    def _load_pdfs_to_string(self, pdf_dir):
        if not os.path.isdir(pdf_dir):
            return ""
        pdf_files = [f for f in os.listdir(pdf_dir) if f.endswith(".pdf")]
        all_text = []
        for pdf_file in pdf_files:
            path = os.path.join(pdf_dir, pdf_file)
            try:
                loader = PyPDFLoader(path)
                pages = loader.load_and_split()
                for doc in pages:
                    all_text.append(doc.page_content)
            except Exception as e:
                print(f"Error loading PDF {pdf_file}: {e}")
        return "\n".join(all_text)

    def _get_text_splitter(self):
        return RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
            length_function=len,
            is_separator_regex=False
        )

    def _load_or_build_index(self):
        if not os.path.exists(INDEX_PATH):
            # Build new index from scratch
            text = self._load_pdfs_to_string(PDF_DIR)
            if not text.strip():
                return FAISS.from_texts([], self.embeddings)
            splitter = self._get_text_splitter()
            docs = splitter.create_documents([text])
            store = FAISS.from_documents(docs, self.embeddings)
            store.save_local(INDEX_PATH)
            return store
        else:
            return FAISS.load_local(INDEX_PATH, self.embeddings, allow_dangerous_deserialization=True)

    def chat(self, message: str, top_k: int = 5) -> str:
        # Retrieve relevant docs from FAISS
        retrieved_docs = self.faiss_store.similarity_search(message, k=top_k)
        context = "\n\n".join([doc.page_content for doc in retrieved_docs])
        # Format history
        history_text = ""
        for turn in self.history:
            history_text += f"{turn['role'].capitalize()}: {turn['content']}\n"

        full_prompt = f"""
You are an assistant for a fleet management system. 
Always tailor your answers with clear, step-by-step instructions based on the user's role (Driver, Manager, or Super Admin).
When the user asks how to schedule a trip, request leave, or any workflow-related question, respond specifically for their role.
If their role is mentioned in the question, use it to guide your answer.

Conversation so far:
{history_text}

Relevant information from company documents:
{context}

User question:
{message}

Answer as a helpful assistant, following company fleet management procedures and adapting your response based on the user's role.
"""
        try:
            response = self.model.generate_content(full_prompt)
            bot_reply = response.text
            self.history.append({"role": "user", "content": message})
            self.history.append({"role": "bot", "content": bot_reply})
            return bot_reply
        except Exception as e:
            print(f"Error with Gemini API: {e}")
            return "Sorry, I encountered an error trying to generate a response."

# ---- INIT THE BOT ----
bot = GeminiChatBot()

# ---- API ROUTES ----
@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    if not request.message:
        raise HTTPException(status_code=400, detail="Message is required")
    reply = bot.chat(request.message)
    return ChatResponse(response=reply)

