from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
import uuid
from datetime import datetime

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

experiments = []

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

    experiment = {
        "experiment_id": experiment_id,
        "created_at": datetime.now().isoformat(),
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

    experiments.append(experiment)

    return {
        "status": "success",
        "message": "Experimento creado correctamente",
        "experiment_id": experiment_id,
        "experiment": experiment,
    }

@app.get("/experiments")
def list_experiments():
    return {
        "total": len(experiments),
        "experiments": experiments,
    }

@app.get("/report/{experiment_id}", response_class=PlainTextResponse)
def generate_report(experiment_id: str):
    experiment = next(
        (exp for exp in experiments if exp["experiment_id"] == experiment_id),
        None
    )

    if not experiment:
        raise HTTPException(status_code=404, detail="Experimento no encontrado")

    report = f"""
# REPORTE EXPERIMENTAL TWINIA

## Identificación

ID del experimento: {experiment["experiment_id"]}
Fecha de creación: {experiment["created_at"]}

## Configuración robótica

Robot seleccionado: {experiment["robot"]}
Ambiente: {experiment["escenario"]}
Sensor: {experiment["sensor"]}

## Inteligencia artificial

Modelo IA: {experiment["ia"]}
Modo de trabajo: {experiment["modo_trabajo"]}
Épocas de entrenamiento: {experiment["training_epochs"]}
Tamaño del dataset: {experiment["dataset_size"]} muestras

## Validación

Tipo de validación: {experiment["validation_mode"]}

## NVIDIA Cosmos

Cosmos activado: {experiment["cosmos"]}

Prompt de generación sintética:

{experiment["cosmos_prompt"]}

## Interpretación

Este experimento fue configurado desde TWINIA Platform como una plantilla para procesos de IA física, gemelos digitales, generación de datos sintéticos y validación Sim-to-Real.
"""

    return report