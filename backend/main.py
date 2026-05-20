from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
import uuid

app = FastAPI(title="TWINIA Backend")

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
    return {"message": "TWINIA Backend Online"}

@app.post("/create-experiment")
async def create_experiment(
    robot: str = Form(...),
    ia: str = Form(...),
    escenario: str = Form(...),
    sensor: str = Form(...),
    cosmos: str = Form(...),
    cosmos_prompt: str = Form(...),
    modo_trabajo: str = Form(...),
    dataset_size: int = Form(...),
    training_epochs: int = Form(...),
    validation_mode: str = Form(...),
):
    experiment_id = str(uuid.uuid4())[:8]

    return {
        "status": "success",
        "message": "Experimento creado correctamente",
        "experiment_id": experiment_id,
        "robot": robot,
        "ia": ia,
        "escenario": escenario,
        "sensor": sensor,
        "cosmos": cosmos,
        "cosmos_prompt": cosmos_prompt,
        "modo_trabajo": modo_trabajo,
        "dataset_size": dataset_size,
        "training_epochs": training_epochs,
        "validation_mode": validation_mode,
    }