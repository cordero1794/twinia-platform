from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json
import shutil
import uuid

app = FastAPI(title="TWINIA Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
PROJECTS_DIR = BASE_DIR / "generated_projects"
PROJECTS_DIR.mkdir(exist_ok=True)


@app.get("/")
def home():
    return {
        "status": "ok",
        "message": "TWINIA Backend funcionando correctamente",
    }


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
    robot_files: list[UploadFile] = File(default=[]),
    environment_files: list[UploadFile] = File(default=[]),
    dataset_files: list[UploadFile] = File(default=[]),
):
    experiment_id = str(uuid.uuid4())[:8]
    experiment_dir = PROJECTS_DIR / f"TWINIA_EXPERIMENT_{experiment_id}"

    robot_dir = experiment_dir / "robot_assets"
    env_dir = experiment_dir / "environment_assets"
    dataset_dir = experiment_dir / "datasets"
    config_dir = experiment_dir / "config"
    scripts_dir = experiment_dir / "scripts"
    reports_dir = experiment_dir / "reports"
    cosmos_dir = experiment_dir / "cosmos"

    for folder in [
        robot_dir,
        env_dir,
        dataset_dir,
        config_dir,
        scripts_dir,
        reports_dir,
        cosmos_dir,
    ]:
        folder.mkdir(parents=True, exist_ok=True)

    config = {
        "experiment_id": experiment_id,
        "robot": robot,
        "ia": ia,
        "escenario": escenario,
        "sensor": sensor,
        "cosmos": cosmos == "true",
        "cosmos_prompt": cosmos_prompt,
        "modo_trabajo": modo_trabajo,
        "dataset_size": dataset_size,
        "training_epochs": training_epochs,
        "validation_mode": validation_mode,
        "robot_files": [],
        "environment_files": [],
        "dataset_files": [],
    }

    for uploaded_file in robot_files:
        target = robot_dir / uploaded_file.filename
        with target.open("wb") as buffer:
            shutil.copyfileobj(uploaded_file.file, buffer)
        config["robot_files"].append(uploaded_file.filename)

    for uploaded_file in environment_files:
        target = env_dir / uploaded_file.filename
        with target.open("wb") as buffer:
            shutil.copyfileobj(uploaded_file.file, buffer)
        config["environment_files"].append(uploaded_file.filename)

    for uploaded_file in dataset_files:
        target = dataset_dir / uploaded_file.filename
        with target.open("wb") as buffer:
            shutil.copyfileobj(uploaded_file.file, buffer)
        config["dataset_files"].append(uploaded_file.filename)

    with (config_dir / "experiment_config.json").open("w", encoding="utf-8") as file:
        json.dump(config, file, indent=2, ensure_ascii=False)

    report = f"""# REPORTE EXPERIMENTAL TWINIA

## Configuración

- Robot: {robot}
- IA: {ia}
- Escenario: {escenario}
- Sensor: {sensor}
- Cosmos: {cosmos}
- Modo de trabajo: {modo_trabajo}
- Tamaño del dataset: {dataset_size}
- Épocas de entrenamiento: {training_epochs}
- Validación: {validation_mode}

## Prompt Cosmos

{cosmos_prompt}

## Archivos

- Robot: {len(config["robot_files"])}
- Ambiente: {len(config["environment_files"])}
- Dataset: {len(config["dataset_files"])}

Este experimento fue generado desde TWINIA Platform.
"""

    with (reports_dir / "reporte_experimento.md").open("w", encoding="utf-8") as file:
        file.write(report)

    train_script = f'''print("Entrenamiento iniciado")
print("Modelo IA: {ia}")
print("Dataset size: {dataset_size}")
print("Epochs: {training_epochs}")
'''

    with (scripts_dir / "train_model.py").open("w", encoding="utf-8") as file:
        file.write(train_script)

    cosmos_config = {
        "enabled": cosmos == "true",
        "prompt": cosmos_prompt,
        "input": "Isaac Sim video or uploaded dataset",
        "output": "synthetic dataset",
    }

    with (cosmos_dir / "cosmos_config.json").open("w", encoding="utf-8") as file:
        json.dump(cosmos_config, file, indent=2, ensure_ascii=False)

    return {
        "status": "success",
        "message": "Experimento TWINIA creado correctamente",
        "experiment_id": experiment_id,
        "path": str(experiment_dir),
        "config": config,
    }


@app.get("/experiments")
def list_experiments():
    experiments = []

    for folder in PROJECTS_DIR.iterdir():
        if folder.is_dir():
            experiments.append(folder.name)

    return {
        "total": len(experiments),
        "experiments": experiments,
    }