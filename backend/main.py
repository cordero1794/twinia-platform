from fastapi import FastAPI, Form, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pymongo import MongoClient
from dotenv import load_dotenv
import uuid
from datetime import datetime
from zoneinfo import ZoneInfo
import os
import shutil

load_dotenv()

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

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise RuntimeError("No se encontró la variable de entorno MONGO_URI")

client = MongoClient(MONGO_URI)
db = client["twinia_db"]
experiments_collection = db["experiments"]

UPLOAD_DIR = "uploads"

ROBOT_DIR = os.path.join(UPLOAD_DIR, "robots")
ENVIRONMENT_DIR = os.path.join(UPLOAD_DIR, "environments")
DATASET_DIR = os.path.join(UPLOAD_DIR, "datasets")

os.makedirs(ROBOT_DIR, exist_ok=True)
os.makedirs(ENVIRONMENT_DIR, exist_ok=True)
os.makedirs(DATASET_DIR, exist_ok=True)


@app.get("/")
def home():
    return {"message": "TWINIA Backend Online with MongoDB"}


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
    expected_map: int = Form(0),
    expected_precision: int = Form(0),
    expected_recall: int = Form(0),
    expected_fps: int = Form(0),
    sim_to_real_reduction: int = Form(0),
    robot_files: list[UploadFile] = File([]),
    environment_files: list[UploadFile] = File([]),
    dataset_files: list[UploadFile] = File([]),
):
    experiment_id = str(uuid.uuid4())[:8]

    saved_robot_files = []
    saved_environment_files = []
    saved_dataset_files = []

    robot_experiment_dir = os.path.join(ROBOT_DIR, experiment_id)
    environment_experiment_dir = os.path.join(ENVIRONMENT_DIR, experiment_id)
    dataset_experiment_dir = os.path.join(DATASET_DIR, experiment_id)

    os.makedirs(robot_experiment_dir, exist_ok=True)
    os.makedirs(environment_experiment_dir, exist_ok=True)
    os.makedirs(dataset_experiment_dir, exist_ok=True)

    for file in robot_files:
        if file.filename:
            file_path = os.path.join(robot_experiment_dir, file.filename)

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            saved_robot_files.append(
                {
                    "filename": file.filename,
                    "path": file_path,
                    "content_type": file.content_type,
                }
            )

    for file in environment_files:
        if file.filename:
            file_path = os.path.join(environment_experiment_dir, file.filename)

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            saved_environment_files.append(
                {
                    "filename": file.filename,
                    "path": file_path,
                    "content_type": file.content_type,
                }
            )

    for file in dataset_files:
        if file.filename:
            file_path = os.path.join(dataset_experiment_dir, file.filename)

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            saved_dataset_files.append(
                {
                    "filename": file.filename,
                    "path": file_path,
                    "content_type": file.content_type,
                }
            )

    experiment = {
        "experiment_id": experiment_id,
        "created_at": datetime.now(
            ZoneInfo("America/Bogota")
        ).strftime("%Y-%m-%d %H:%M:%S"),
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
        "expected_map": expected_map,
        "expected_precision": expected_precision,
        "expected_recall": expected_recall,
        "expected_fps": expected_fps,
        "sim_to_real_reduction": sim_to_real_reduction,
        "robot_files": saved_robot_files,
        "environment_files": saved_environment_files,
        "dataset_files": saved_dataset_files,
    }

    experiments_collection.insert_one(experiment.copy())

    return {
        "status": "success",
        "message": "Experimento creado correctamente y guardado en MongoDB",
        "experiment_id": experiment_id,
        "experiment": experiment,
    }


@app.get("/experiments")
def list_experiments():
    experiments = list(
        experiments_collection.find({}, {"_id": 0}).sort("created_at", -1)
    )

    return {
        "total": len(experiments),
        "experiments": experiments,
    }


@app.get("/experiment/{experiment_id}")
def get_experiment(experiment_id: str):
    experiment = experiments_collection.find_one(
        {"experiment_id": experiment_id},
        {"_id": 0},
    )

    if not experiment:
        raise HTTPException(status_code=404, detail="Experimento no encontrado")

    return experiment


@app.get("/report/{experiment_id}", response_class=HTMLResponse)
def generate_report(experiment_id: str):
    experiment = experiments_collection.find_one(
        {"experiment_id": experiment_id},
        {"_id": 0},
    )

    if not experiment:
        raise HTTPException(status_code=404, detail="Experimento no encontrado")

    cosmos_status = "Activado" if experiment.get("cosmos") == "true" else "Desactivado"

    robot_files_html = "".join(
        f"<li>{file.get('filename', 'Archivo sin nombre')}</li>"
        for file in experiment.get("robot_files", [])
    ) or "<li>No se cargaron archivos de robot.</li>"

    environment_files_html = "".join(
        f"<li>{file.get('filename', 'Archivo sin nombre')}</li>"
        for file in experiment.get("environment_files", [])
    ) or "<li>No se cargaron archivos de ambiente.</li>"

    dataset_files_html = "".join(
        f"<li>{file.get('filename', 'Archivo sin nombre')}</li>"
        for file in experiment.get("dataset_files", [])
    ) or "<li>No se cargaron archivos de dataset.</li>"

    html = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8" />
        <title>Reporte TWINIA - {experiment["experiment_id"]}</title>
        <style>
            body {{
                margin: 0;
                font-family: Arial, sans-serif;
                background: #050505;
                color: #ffffff;
                line-height: 1.6;
            }}

            .container {{
                max-width: 1000px;
                margin: auto;
                padding: 40px;
            }}

            .header {{
                border-bottom: 3px solid #76B900;
                padding-bottom: 25px;
                margin-bottom: 35px;
            }}

            h1 {{
                font-size: 42px;
                margin: 0;
            }}

            h2 {{
                color: #76B900;
                margin-top: 35px;
            }}

            h3 {{
                margin-top: 20px;
            }}

            .subtitle {{
                color: #bbbbbb;
                font-size: 18px;
            }}

            .card {{
                background: #111111;
                border: 1px solid #2a2a2a;
                border-radius: 18px;
                padding: 24px;
                margin-bottom: 25px;
            }}

            .grid {{
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
            }}

            .item {{
                background: #1b1b1b;
                border-radius: 14px;
                padding: 16px;
            }}

            .label {{
                color: #888888;
                font-size: 13px;
            }}

            .value {{
                font-size: 18px;
                font-weight: bold;
                color: #ffffff;
            }}

            .metric {{
                color: #76B900;
                font-size: 24px;
                font-weight: bold;
            }}

            .prompt {{
                background: #000000;
                border-left: 4px solid #76B900;
                padding: 18px;
                border-radius: 12px;
                color: #dddddd;
                white-space: pre-wrap;
            }}

            ul {{
                background: #1b1b1b;
                border-radius: 14px;
                padding: 18px 18px 18px 38px;
            }}

            li {{
                margin-bottom: 8px;
            }}

            button {{
                background: #76B900;
                color: #000000;
                border: none;
                padding: 14px 24px;
                border-radius: 12px;
                font-weight: bold;
                cursor: pointer;
                margin-top: 20px;
            }}

            .footer {{
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #333333;
                color: #888888;
                font-size: 14px;
            }}

            @media print {{
                button {{
                    display: none;
                }}

                body {{
                    background: white;
                    color: black;
                }}

                .card, .item, ul {{
                    background: white;
                    color: black;
                    border: 1px solid #cccccc;
                }}

                .value {{
                    color: black;
                }}

                h2, .metric {{
                    color: #4c7f00;
                }}
            }}
        </style>
    </head>

    <body>
        <div class="container">
            <div class="header">
                <h1>TWINIA.AI</h1>
                <p class="subtitle">
                    Reporte técnico experimental de IA física, gemelos digitales y datos sintéticos
                </p>
                <button onclick="window.print()">Descargar / Imprimir PDF</button>
            </div>

            <div class="card">
                <h2>1. Identificación del experimento</h2>
                <div class="grid">
                    <div class="item">
                        <div class="label">ID del experimento</div>
                        <div class="value">{experiment.get("experiment_id", "")}</div>
                    </div>
                    <div class="item">
                        <div class="label">Fecha de creación</div>
                        <div class="value">{experiment.get("created_at", "")}</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h2>2. Configuración robótica</h2>
                <div class="grid">
                    <div class="item">
                        <div class="label">Robot</div>
                        <div class="value">{experiment.get("robot", "")}</div>
                    </div>
                    <div class="item">
                        <div class="label">Ambiente</div>
                        <div class="value">{experiment.get("escenario", "")}</div>
                    </div>
                    <div class="item">
                        <div class="label">Sensor</div>
                        <div class="value">{experiment.get("sensor", "")}</div>
                    </div>
                    <div class="item">
                        <div class="label">Validación</div>
                        <div class="value">{experiment.get("validation_mode", "")}</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h2>3. Configuración de inteligencia artificial</h2>
                <div class="grid">
                    <div class="item">
                        <div class="label">Modelo IA</div>
                        <div class="value">{experiment.get("ia", "")}</div>
                    </div>
                    <div class="item">
                        <div class="label">Modo de trabajo</div>
                        <div class="value">{experiment.get("modo_trabajo", "")}</div>
                    </div>
                    <div class="item">
                        <div class="label">Tamaño del dataset</div>
                        <div class="value">{experiment.get("dataset_size", 0)} muestras</div>
                    </div>
                    <div class="item">
                        <div class="label">Épocas de entrenamiento</div>
                        <div class="value">{experiment.get("training_epochs", 0)}</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h2>4. Métricas esperadas</h2>
                <div class="grid">
                    <div class="item">
                        <div class="label">mAP esperado</div>
                        <div class="metric">{experiment.get("expected_map", 0)}%</div>
                    </div>
                    <div class="item">
                        <div class="label">Precisión esperada</div>
                        <div class="metric">{experiment.get("expected_precision", 0)}%</div>
                    </div>
                    <div class="item">
                        <div class="label">Recall esperado</div>
                        <div class="metric">{experiment.get("expected_recall", 0)}%</div>
                    </div>
                    <div class="item">
                        <div class="label">FPS esperado</div>
                        <div class="metric">{experiment.get("expected_fps", 0)}</div>
                    </div>
                    <div class="item">
                        <div class="label">Reducción Sim-to-Real</div>
                        <div class="metric">{experiment.get("sim_to_real_reduction", 0)}%</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h2>5. Archivos cargados</h2>

                <h3>Robot personalizado</h3>
                <ul>{robot_files_html}</ul>

                <h3>Ambiente personalizado</h3>
                <ul>{environment_files_html}</ul>

                <h3>Dataset / datos sintéticos</h3>
                <ul>{dataset_files_html}</ul>
            </div>

            <div class="card">
                <h2>6. NVIDIA Cosmos</h2>
                <div class="item">
                    <div class="label">Estado</div>
                    <div class="value">{cosmos_status}</div>
                </div>

                <h3>Prompt sintético</h3>
                <div class="prompt">{experiment.get("cosmos_prompt", "")}</div>
            </div>

            <div class="card">
                <h2>7. Interpretación técnica</h2>
                <p>
                    Este experimento fue configurado desde TWINIA Platform como una plantilla experimental
                    para procesos de IA física, gemelos digitales, generación de datos sintéticos y validación
                    Sim-to-Real.
                </p>
                <p>
                    La información queda almacenada en MongoDB, lo cual permite trazabilidad, consulta histórica,
                    generación de reportes y futuras comparaciones entre experimentos.
                </p>
            </div>

            <div class="footer">
                Reporte generado automáticamente por TWINIA Platform.
            </div>
        </div>
    </body>
    </html>
    """

    return html