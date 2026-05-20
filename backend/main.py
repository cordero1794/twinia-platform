from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
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
    expected_map: int = Form(0),
    expected_precision: int = Form(0),
    expected_recall: int = Form(0),
    expected_fps: int = Form(0),
    sim_to_real_reduction: int = Form(0),
):
    experiment_id = str(uuid.uuid4())[:8]

    experiment = {
        "experiment_id": experiment_id,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
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


@app.get("/report/{experiment_id}", response_class=HTMLResponse)
def generate_report(experiment_id: str):
    experiment = next(
        (exp for exp in experiments if exp["experiment_id"] == experiment_id),
        None
    )

    if not experiment:
        raise HTTPException(status_code=404, detail="Experimento no encontrado")

    cosmos_status = "Activado" if experiment["cosmos"] == "true" else "Desactivado"

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
            }}

            .footer {{
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #333333;
                color: #888888;
                font-size: 14px;
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

            @media print {{
                button {{
                    display: none;
                }}

                body {{
                    background: white;
                    color: black;
                }}

                .card, .item {{
                    background: white;
                    color: black;
                    border: 1px solid #cccccc;
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
                <p class="subtitle">Reporte técnico experimental de IA física, gemelos digitales y datos sintéticos</p>
                <button onclick="window.print()">Descargar / Imprimir PDF</button>
            </div>

            <div class="card">
                <h2>1. Identificación del experimento</h2>
                <div class="grid">
                    <div class="item">
                        <div class="label">ID del experimento</div>
                        <div class="value">{experiment["experiment_id"]}</div>
                    </div>
                    <div class="item">
                        <div class="label">Fecha de creación</div>
                        <div class="value">{experiment["created_at"]}</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h2>2. Configuración robótica</h2>
                <div class="grid">
                    <div class="item">
                        <div class="label">Robot</div>
                        <div class="value">{experiment["robot"]}</div>
                    </div>
                    <div class="item">
                        <div class="label">Ambiente</div>
                        <div class="value">{experiment["escenario"]}</div>
                    </div>
                    <div class="item">
                        <div class="label">Sensor</div>
                        <div class="value">{experiment["sensor"]}</div>
                    </div>
                    <div class="item">
                        <div class="label">Validación</div>
                        <div class="value">{experiment["validation_mode"]}</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h2>3. Configuración de inteligencia artificial</h2>
                <div class="grid">
                    <div class="item">
                        <div class="label">Modelo IA</div>
                        <div class="value">{experiment["ia"]}</div>
                    </div>
                    <div class="item">
                        <div class="label">Modo de trabajo</div>
                        <div class="value">{experiment["modo_trabajo"]}</div>
                    </div>
                    <div class="item">
                        <div class="label">Tamaño del dataset</div>
                        <div class="value">{experiment["dataset_size"]} muestras</div>
                    </div>
                    <div class="item">
                        <div class="label">Épocas de entrenamiento</div>
                        <div class="value">{experiment["training_epochs"]}</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h2>4. Métricas esperadas</h2>
                <div class="grid">
                    <div class="item">
                        <div class="label">mAP esperado</div>
                        <div class="metric">{experiment["expected_map"]}%</div>
                    </div>
                    <div class="item">
                        <div class="label">Precisión esperada</div>
                        <div class="metric">{experiment["expected_precision"]}%</div>
                    </div>
                    <div class="item">
                        <div class="label">Recall esperado</div>
                        <div class="metric">{experiment["expected_recall"]}%</div>
                    </div>
                    <div class="item">
                        <div class="label">FPS esperado</div>
                        <div class="metric">{experiment["expected_fps"]}</div>
                    </div>
                    <div class="item">
                        <div class="label">Reducción Sim-to-Real</div>
                        <div class="metric">{experiment["sim_to_real_reduction"]}%</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h2>5. NVIDIA Cosmos</h2>
                <div class="item">
                    <div class="label">Estado</div>
                    <div class="value">{cosmos_status}</div>
                </div>

                <h3>Prompt sintético</h3>
                <div class="prompt">
                    {experiment["cosmos_prompt"]}
                </div>
            </div>

            <div class="card">
                <h2>6. Interpretación técnica</h2>
                <p>
                    Este experimento fue configurado desde TWINIA Platform como una plantilla experimental
                    para procesos de IA física, gemelos digitales, generación de datos sintéticos y validación
                    Sim-to-Real.
                </p>
                <p>
                    La configuración permite documentar el tipo de robot, ambiente, sensor, modelo de inteligencia
                    artificial, tamaño del dataset, épocas de entrenamiento y métricas esperadas para análisis
                    comparativos posteriores.
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