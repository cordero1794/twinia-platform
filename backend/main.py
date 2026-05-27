from fastapi import FastAPI, Form, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, Response, FileResponse
from pymongo import MongoClient
from dotenv import load_dotenv
import uuid
from datetime import datetime
from zoneinfo import ZoneInfo
import os
import shutil
import json

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
PACKAGE_DIR = "packages"

ROBOT_DIR = os.path.join(UPLOAD_DIR, "robots")
ENVIRONMENT_DIR = os.path.join(UPLOAD_DIR, "environments")
DATASET_DIR = os.path.join(UPLOAD_DIR, "datasets")

os.makedirs(ROBOT_DIR, exist_ok=True)
os.makedirs(ENVIRONMENT_DIR, exist_ok=True)
os.makedirs(DATASET_DIR, exist_ok=True)
os.makedirs(PACKAGE_DIR, exist_ok=True)


@app.get("/")
def home():
    return {"message": "TWINIA Backend Online with MongoDB"}


def safe_usda_text(value):
    if value is None:
        return ""
    return str(value).replace('"', "'").replace("\n", " ")


def save_uploaded_files(files, upload_dir, package_dir, relative_folder):
    saved_files = []

    os.makedirs(upload_dir, exist_ok=True)
    os.makedirs(package_dir, exist_ok=True)

    for file in files:
        if not file.filename:
            continue

        upload_path = os.path.join(upload_dir, file.filename)
        package_path = os.path.join(package_dir, file.filename)

        with open(upload_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        shutil.copy2(upload_path, package_path)

        saved_files.append(
            {
                "filename": file.filename,
                "path": upload_path,
                "package_path": package_path,
                "relative_path": f"./{relative_folder}/{file.filename}",
                "content_type": file.content_type,
            }
        )

    return saved_files


def build_usda(exp):
    cosmos_options = exp.get("cosmos_options", {})
    cosmos_estimate = exp.get("cosmos_estimate", {})
    dsr_distribution = exp.get("dsr_distribution", {})

    return f'''#usda 1.0
(
    defaultPrim = "TWINIA_Experiment"
    metersPerUnit = 1
    upAxis = "Z"
)

def Xform "TWINIA_Experiment"
{{
    customData = {{
        string experiment_id = "{safe_usda_text(exp.get("experiment_id", ""))}"
        string created_at = "{safe_usda_text(exp.get("created_at", ""))}"
        string robot = "{safe_usda_text(exp.get("robot", ""))}"
        string ia_model = "{safe_usda_text(exp.get("ia", ""))}"
        string environment = "{safe_usda_text(exp.get("escenario", ""))}"
        string sensor = "{safe_usda_text(exp.get("sensor", ""))}"

        string robot_path = "{safe_usda_text(exp.get("robot_path", ""))}"
        string environment_path = "{safe_usda_text(exp.get("environment_path", ""))}"
        string dataset_path = "{safe_usda_text(exp.get("dataset_path", ""))}"

        string validation_mode = "{safe_usda_text(exp.get("validation_mode", ""))}"
        string work_mode = "{safe_usda_text(exp.get("modo_trabajo", ""))}"
        string cosmos_prompt = "{safe_usda_text(exp.get("cosmos_prompt", ""))}"

        int dataset_size = {exp.get("dataset_size", 0)}
        int training_epochs = {exp.get("training_epochs", 0)}
        int expected_map = {exp.get("expected_map", 0)}
        int expected_precision = {exp.get("expected_precision", 0)}
        int expected_recall = {exp.get("expected_recall", 0)}
        int expected_fps = {exp.get("expected_fps", 0)}
        int sim_to_real_reduction = {exp.get("sim_to_real_reduction", 0)}

        bool cosmos_lluvia = {str(cosmos_options.get("lluvia", False)).lower()}
        bool cosmos_noche = {str(cosmos_options.get("noche", False)).lower()}
        bool cosmos_peatones = {str(cosmos_options.get("peatones", False)).lower()}
        bool cosmos_trafico = {str(cosmos_options.get("trafico", False)).lower()}
        bool cosmos_niebla = {str(cosmos_options.get("niebla", False)).lower()}
        bool cosmos_obstaculos = {str(cosmos_options.get("obstaculos", False)).lower()}

        int cosmos_images = {cosmos_estimate.get("images", 0)}
        int cosmos_videos = {cosmos_estimate.get("videos", 0)}
        double cosmos_size_gb = {cosmos_estimate.get("sizeGB", 0)}
        double cosmos_gpu_hours = {cosmos_estimate.get("gpuHours", 0)}

        int dsr_isaac_sim = {dsr_distribution.get("isaac_sim", 70)}
        int dsr_cosmos = {dsr_distribution.get("cosmos", 20)}
        int dsr_real_data = {dsr_distribution.get("real_data", 10)}
    }}

    def Xform "Robot"
    {{
        customData = {{
            string selected_robot = "{safe_usda_text(exp.get("robot", ""))}"
            string asset_path = "{safe_usda_text(exp.get("robot_path", ""))}"
        }}
    }}

    def Xform "Environment"
    {{
        customData = {{
            string selected_environment = "{safe_usda_text(exp.get("escenario", ""))}"
            string asset_path = "{safe_usda_text(exp.get("environment_path", ""))}"
        }}
    }}

    def Xform "Synthetic_Data"
    {{
        customData = {{
            string generator = "NVIDIA Cosmos"
            string dataset_path = "{safe_usda_text(exp.get("dataset_path", ""))}"
            string prompt = "{safe_usda_text(exp.get("cosmos_prompt", ""))}"
        }}
    }}

    def Xform "AI_Model"
    {{
        customData = {{
            string model = "{safe_usda_text(exp.get("ia", ""))}"
            string sensor = "{safe_usda_text(exp.get("sensor", ""))}"
        }}
    }}
}}
'''
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
    cosmos_options: str = Form("{}"),
    cosmos_estimate: str = Form("{}"),
    dsr_distribution: str = Form("{}"),
):
    experiment_id = str(uuid.uuid4())[:8]

    created_at = datetime.now(
        ZoneInfo("America/Bogota")
    ).strftime("%Y-%m-%d %H:%M:%S")

    robot_experiment_dir = os.path.join(ROBOT_DIR, experiment_id)
    environment_experiment_dir = os.path.join(ENVIRONMENT_DIR, experiment_id)
    dataset_experiment_dir = os.path.join(DATASET_DIR, experiment_id)

    package_root = os.path.join(PACKAGE_DIR, f"twinia_experiment_{experiment_id}")
    package_robot_dir = os.path.join(package_root, "robots")
    package_environment_dir = os.path.join(package_root, "environments")
    package_dataset_dir = os.path.join(package_root, "datasets")
    package_metadata_dir = os.path.join(package_root, "metadata")

    os.makedirs(package_root, exist_ok=True)
    os.makedirs(package_robot_dir, exist_ok=True)
    os.makedirs(package_environment_dir, exist_ok=True)
    os.makedirs(package_dataset_dir, exist_ok=True)
    os.makedirs(package_metadata_dir, exist_ok=True)

    saved_robot_files = save_uploaded_files(
        robot_files,
        robot_experiment_dir,
        package_robot_dir,
        "robots",
    )

    saved_environment_files = save_uploaded_files(
        environment_files,
        environment_experiment_dir,
        package_environment_dir,
        "environments",
    )

    saved_dataset_files = save_uploaded_files(
        dataset_files,
        dataset_experiment_dir,
        package_dataset_dir,
        "datasets",
    )

    robot_path = (
        saved_robot_files[0]["relative_path"]
        if saved_robot_files
        else "SPOT_INTERNAL"
    )

    environment_path = (
        saved_environment_files[0]["relative_path"]
        if saved_environment_files
        else ""
    )

    dataset_path = "./datasets" if saved_dataset_files else ""

    try:
        cosmos_options_dict = json.loads(cosmos_options)
    except Exception:
        cosmos_options_dict = {}

    try:
        cosmos_estimate_dict = json.loads(cosmos_estimate)
    except Exception:
        cosmos_estimate_dict = {}

    try:
        dsr_distribution_dict = json.loads(dsr_distribution)
    except Exception:
        dsr_distribution_dict = {
            "isaac_sim": 70,
            "cosmos": 20,
            "real_data": 10,
        }

    experiment = {
        "experiment_id": experiment_id,
        "created_at": created_at,
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
        "cosmos_options": cosmos_options_dict,
        "cosmos_estimate": cosmos_estimate_dict,
        "dsr_distribution": dsr_distribution_dict,
        "robot_path": robot_path,
        "environment_path": environment_path,
        "dataset_path": dataset_path,
        "package_folder": package_root,
        "package_download_url": f"/download-package/{experiment_id}",
    }

    usda_content = build_usda(experiment)

    usda_path = os.path.join(package_root, "experiment.usda")

    with open(usda_path, "w", encoding="utf-8") as f:
        f.write(usda_content)

    metadata_path = os.path.join(
        package_metadata_dir,
        "experiment_config.json"
    )

    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(experiment, f, indent=4, ensure_ascii=False)

    zip_base = os.path.join(
        PACKAGE_DIR,
        f"twinia_experiment_{experiment_id}"
    )

    zip_path = shutil.make_archive(
        zip_base,
        "zip",
        root_dir=package_root
    )

    experiment["package_zip_path"] = zip_path

    experiments_collection.insert_one(experiment.copy())

    return {
        "status": "success",
        "message": "Experimento creado correctamente, guardado en MongoDB y empaquetado para Omniverse",
        "experiment_id": experiment_id,
        "experiment": experiment,
        "usda_file": "experiment.usda",
        "package_file": f"twinia_experiment_{experiment_id}.zip",
        "package_download_url": f"/download-package/{experiment_id}",
        "robot_path": robot_path,
        "environment_path": environment_path,
        "dataset_path": dataset_path,
    }


@app.get("/download-package/{experiment_id}")
def download_package(experiment_id: str):
    zip_path = os.path.join(
        PACKAGE_DIR,
        f"twinia_experiment_{experiment_id}.zip"
    )

    if not os.path.exists(zip_path):
        raise HTTPException(
            status_code=404,
            detail="Paquete ZIP no encontrado"
        )

    return FileResponse(
        path=zip_path,
        filename=f"twinia_experiment_{experiment_id}.zip",
        media_type="application/zip"
    )


@app.get("/export-usd/{experiment_id}")
async def export_usd(experiment_id: str):
    exp = experiments_collection.find_one(
        {"experiment_id": experiment_id},
        {"_id": 0}
    )

    if not exp:
        raise HTTPException(
            status_code=404,
            detail="Experimento no encontrado"
        )

    usd_content = build_usda(exp)

    return Response(
        content=usd_content,
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename=twinia_experiment_{experiment_id}.usda"
        },
    )
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

    package_url = f"/download-package/{experiment_id}"

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
                word-break: break-word;
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

            .btn {{
                background: #76B900;
                color: #000000;
                border: none;
                padding: 14px 24px;
                border-radius: 12px;
                font-weight: bold;
                cursor: pointer;
                margin-top: 20px;
                text-decoration: none;
                display: inline-block;
                margin-right: 20px;
                width: 280px;
                text-align: center;
                box-sizing: border-box;
            }}

            .btn-secondary {{
                background: #000000;
                color: #76B900;
                border: 1px solid #76B900;
            }}

            .footer {{
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #333333;
                color: #888888;
                font-size: 14px;
            }}

            @media print {{
                .btn {{
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

                <a href="javascript:window.print()" class="btn">
                    Descargar / Imprimir PDF
                </a>

                <a href="/export-usd/{experiment_id}" target="_blank" class="btn btn-secondary">
                    Descargar solo USDA
                </a>

                <a href="{package_url}" target="_blank" class="btn">
                    Descargar paquete Omniverse ZIP
                </a>
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
                    <div class="item">
                        <div class="label">Paquete ZIP</div>
                        <div class="value">twinia_experiment_{experiment_id}.zip</div>
                    </div>
                    <div class="item">
                        <div class="label">USDA principal</div>
                        <div class="value">experiment.usda</div>
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
                        <div class="label">Ruta relativa robot</div>
                        <div class="value">{experiment.get("robot_path", "")}</div>
                    </div>
                    <div class="item">
                        <div class="label">Ruta relativa ambiente</div>
                        <div class="value">{experiment.get("environment_path", "")}</div>
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
                    <div class="item">
                        <div class="label">Ruta relativa dataset</div>
                        <div class="value">{experiment.get("dataset_path", "")}</div>
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
                <h2>5. Archivos cargados e incluidos en el ZIP</h2>

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
                    El nuevo paquete ZIP contiene el archivo USDA principal y los assets cargados por el usuario,
                    organizados en carpetas relativas para facilitar su apertura en Omniverse / Isaac Sim.
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