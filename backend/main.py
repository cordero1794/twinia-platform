from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Permitir frontend Vercel
origins = [
    "http://localhost:3000",
    "https://twinia-platform.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "message": "TWINIA Backend Online"
    }

@app.post("/generate")
def generate():
    return {
        "status": "success",
        "message": "Experimento generado correctamente",
        "dataset": "1000 muestras",
        "model": "YOLOv8",
        "simulator": "Isaac Sim",
    }