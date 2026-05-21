"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";

const RobotViewer = dynamic(() => import("../components/RobotViewer"), {
  ssr: false,
});

const ModelViewer = dynamic(() => import("../components/ModelViewer"), {
  ssr: false,
});

const EnvironmentViewer = dynamic(
  () => import("../components/EnvironmentViewer"),
  {
    ssr: false,
  }
);

const BACKEND_URL = "https://twinia-backend.onrender.com";

export default function Home() {

  
  const [robot, setRobot] = useState("TWINIA");
  const [ia, setIa] = useState("YOLO");
  const [escenario, setEscenario] = useState("Parque urbano");
  const [sensor, setSensor] = useState("RGB");
  const [cosmos, setCosmos] = useState(true);

  const [modoTrabajo, setModoTrabajo] = useState("Generar dataset sintético");
  const [datasetSize, setDatasetSize] = useState(1000);
  const [trainingEpochs, setTrainingEpochs] = useState(50);
  const [validationMode, setValidationMode] = useState("Sim-to-Real");

  const [expectedMap, setExpectedMap] = useState(75);
  const [expectedPrecision, setExpectedPrecision] = useState(80);
  const [expectedRecall, setExpectedRecall] = useState(78);
  const [expectedFps, setExpectedFps] = useState(25);
  const [simToRealReduction, setSimToRealReduction] = useState(30);

  const [backendStatus, setBackendStatus] = useState("");
  const [experimentId, setExperimentId] = useState("");
  const [experiments, setExperiments] = useState<any[]>([]);

  const [cosmosPrompt, setCosmosPrompt] = useState(
    "Robot cuadrúpedo caminando en un parque urbano con obstáculos reales y líneas podotáctiles."
  );

  const [robotFiles, setRobotFiles] = useState<File[]>([]);
  const [environmentFiles, setEnvironmentFiles] = useState<File[]>([]);
  const [datasetFiles, setDatasetFiles] = useState<File[]>([]);
  const [datasetInfo, setDatasetInfo] = useState({
    totalImages: 0,
    totalVideos: 0,
    totalLabels: 0,
    totalZip: 0,
    totalSizeMB: 0,
    datasetReady: false,
  });

  const [cosmosOptions, setCosmosOptions] = useState({
    lluvia: false,
    noche: false,
    peatones: true,
    trafico: false,
    niebla: false,
    obstaculos: true,
  });

  const [cosmosEstimate, setCosmosEstimate] = useState({
    images: 0,
    videos: 0,
    sizeGB: 0,
    gpuHours: 0,
    map: expectedMap,
    precision: expectedPrecision,
    recall: expectedRecall,
    simToReal: simToRealReduction,

  });

  const aplicarModoTrabajo = (modo: string) => {
    setModoTrabajo(modo);

    if (modo === "Solo simulación") {
      setDatasetSize(100);
      setTrainingEpochs(1);
      setExpectedMap(0);
      setExpectedPrecision(0);
      setExpectedRecall(0);
      setExpectedFps(30);
      setSimToRealReduction(10);
      setCosmosPrompt(
        "Simulación básica del robot en un entorno virtual controlado para validar movimiento, sensores y comportamiento inicial."
      );
    }

    if (modo === "Generar dataset sintético") {
      setDatasetSize(3000);
      setTrainingEpochs(1);
      setExpectedMap(0);
      setExpectedPrecision(0);
      setExpectedRecall(0);
      setExpectedFps(25);
      setSimToRealReduction(35);
      setCosmosPrompt(
        "Generar escenas sintéticas variadas del robot en un parque urbano con iluminación cambiante, obstáculos, líneas podotáctiles y objetos relevantes."
      );
    }

    if (modo === "Entrenar modelo IA") {
      setDatasetSize(5000);
      setTrainingEpochs(100);
      setExpectedMap(85);
      setExpectedPrecision(88);
      setExpectedRecall(84);
      setExpectedFps(20);
      setSimToRealReduction(45);
      setCosmosPrompt(
        "Dataset sintético hiperrealista para entrenar un modelo de IA robusto en detección, navegación y reconocimiento del entorno."
      );
    }

    if (modo === "Ejecutar inferencia") {
      setDatasetSize(1000);
      setTrainingEpochs(1);
      setExpectedMap(80);
      setExpectedPrecision(85);
      setExpectedRecall(82);
      setExpectedFps(35);
      setSimToRealReduction(30);
      setCosmosPrompt(
        "Evaluar inferencia en tiempo real con cámara RGB/RGB-D para detectar objetos, líneas podotáctiles y obstáculos."
      );
    }

    if (modo === "Validar Sim-to-Real") {
      setDatasetSize(2000);
      setTrainingEpochs(30);
      setExpectedMap(82);
      setExpectedPrecision(86);
      setExpectedRecall(83);
      setExpectedFps(25);
      setSimToRealReduction(60);
      setCosmosPrompt(
        "Comparar resultados entre simulación, datos sintéticos y escenario real para medir reducción de brecha Sim-to-Real."
      );
    }
  };

  const robotPreview = useMemo(
    () =>
      robotFiles.map((file) => ({
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
      })),
    [robotFiles]
  );

  const environmentPreview = useMemo(
    () =>
      environmentFiles.map((file) => ({
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
      })),
    [environmentFiles]
  );

  const datasetPreview = useMemo(
    () =>
      datasetFiles.map((file) => ({
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
      })),
    [datasetFiles]
  );

  const crearExperimentoBackend = async () => {
    try {
      setBackendStatus("Enviando experimento al backend...");

      const formData = new FormData();

      formData.append("robot", robot);
      formData.append("ia", ia);
      formData.append("escenario", escenario);
      formData.append("sensor", sensor);
      formData.append("cosmos", String(cosmos));
      formData.append("cosmos_prompt", cosmosPrompt);
      formData.append("modo_trabajo", modoTrabajo);
      formData.append("dataset_size", String(datasetSize));
      formData.append("training_epochs", String(trainingEpochs));
      formData.append("validation_mode", validationMode);

      formData.append("expected_map", String(expectedMap));
      formData.append("expected_precision", String(expectedPrecision));
      formData.append("expected_recall", String(expectedRecall));
      formData.append("expected_fps", String(expectedFps));
      formData.append("sim_to_real_reduction", String(simToRealReduction));

      formData.append("cosmos_options", JSON.stringify(cosmosOptions));
      formData.append("cosmos_estimate", JSON.stringify(cosmosEstimate));
      formData.append("dsr_distribution", JSON.stringify({
        isaac_sim: 70,
        cosmos: 20,
        real_data: 10,
      }));

      robotFiles.forEach((file) => formData.append("robot_files", file));

      environmentFiles.forEach((file) =>
        formData.append("environment_files", file)
      );

      datasetFiles.forEach((file) => formData.append("dataset_files", file));

      const response = await fetch(`${BACKEND_URL}/create-experiment`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error en backend");
      }

      const data = await response.json();

      setExperimentId(data.experiment_id);
      setBackendStatus("Experimento creado correctamente");

      alert(`Experimento creado correctamente\n\nID: ${data.experiment_id}`);
    } catch (error) {
      console.error(error);
      setBackendStatus("Error conectando con backend");
      alert("Error conectando con el backend online.");
    }
  };

  const listarExperimentos = async () => {
    try {
      setBackendStatus("Consultando experimentos...");

      const response = await fetch(`${BACKEND_URL}/experiments`);

      if (!response.ok) {
        throw new Error("Error listando experimentos");
      }

      const data = await response.json();

      setExperiments(data.experiments || []);
      setBackendStatus(`Experimentos encontrados: ${data.total}`);
    } catch (error) {
      console.error(error);
      setBackendStatus("Error consultando experimentos");
      alert("Error consultando experimentos.");
    }
  };

  const verReporte = (id: string) => {
    window.open(`${BACKEND_URL}/report/${id}`, "_blank");
  };
const generarPromptCosmos = () => {
  const condiciones = Object.entries(cosmosOptions)
    .filter(([, value]) => value)
    .map(([key]) => key)
    .join(", ");

  const prompt = `Robot ${robot} operando en ${escenario}, usando sensor ${sensor}, para ${modoTrabajo}. Escenario hiperrealista con ${condiciones}, iluminación dinámica, física avanzada y validación ${validationMode}.`;

  setCosmosPrompt(prompt);
};

const estimarCosmos = () => {
  const factor = cosmos ? 1.4 : 1;
  const images = Math.round(datasetSize * factor);
  const videos = Math.max(1, Math.round(images / 3000));
  const sizeGB = Number((images * 0.0012).toFixed(2));
  const gpuHours = Number((trainingEpochs * 0.035 + videos * 0.4).toFixed(2));

  const map = Math.min(95, expectedMap + 6);
  const precision = Math.min(96, expectedPrecision + 5);
  const recall = Math.min(95, expectedRecall + 5);
  const simToReal = Math.min(80, simToRealReduction + 15);

  setCosmosEstimate({
    images,
    videos,
    sizeGB,
    gpuHours,
    map,
    precision,
    recall,
    simToReal,
  });

  setExpectedMap(map);
  setExpectedPrecision(precision);
  setExpectedRecall(recall);
  setSimToRealReduction(simToReal);
};

const aplicarDSR = () => {
  setModoTrabajo("Validar Sim-to-Real");
  setDatasetSize(10000);
  setTrainingEpochs(120);
  setValidationMode("Híbrido DSR");
  setExpectedMap(88);
  setExpectedPrecision(91);
  setExpectedRecall(86);
  setExpectedFps(25);
  setSimToRealReduction(70);

  setCosmosPrompt(
    "Framework DSR: 70% datos simulados en Isaac Sim, 20% datos sintéticos hiperrealistas generados con NVIDIA Cosmos y 10% datos reales para validación Sim-to-Real en robótica móvil."
  );
};

const exportarConfigCosmos = () => {
  const config = {
    robot,
    ia,
    escenario,
    sensor,
    modoTrabajo,
    validationMode,
    cosmos,
    cosmosPrompt,
    cosmosOptions,
    datasetSize,
    trainingEpochs,
    expectedMap,
    expectedPrecision,
    expectedRecall,
    expectedFps,
    simToRealReduction,
  };

  const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "configuracion_cosmos_twinia.json";
  link.click();

  URL.revokeObjectURL(url);
};



  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      <section className="relative px-4 md:px-8 py-10 max-w-[1600px] mx-auto">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_left,#76b900,transparent_35%),radial-gradient(circle_at_bottom_right,#1d4ed8,transparent_30%)]" />

        <div className="relative z-10">
          <nav className="flex justify-between items-center mb-16">
            <div>
              <h1 className="text-3xl font-black tracking-wide">
                TWINIA<span className="text-[#76B900]">.</span>AI
              </h1>

              <p className="text-sm text-zinc-400">
                Physical AI • Digital Twins • Synthetic Data
              </p>
            </div>

<div className="w-[790px] rounded-[2rem] border border-[#76B900]/40 bg-black/80 p-5 backdrop-blur">
  
  <div className="flex items-center justify-between mb-4">
    <div>
      <h3 className="text-xl font-black">
        Tutorías IA
      </h3>

      <p className="text-zinc-400 text-xs">
        Omniverse · Isaac Sim · Cosmos
      </p>
    </div>

    <div className="bg-[#76B900] text-black px-3 py-1 rounded-full font-bold text-xs">
      LIVE
    </div>
  </div>

  <div className="rounded-2xl overflow-hidden border border-zinc-800 mb-4">
    <iframe
      className="w-full h-[320px]"
      src="https://www.youtube.com/embed/NAVzjKNa6ro?si=ARU06yt4PgDykX67" title="YouTube video player"
      title="Omniverse"
      allowFullScreen
    />
  </div>

  <div className="grid grid-cols-2 gap-2">

    <button className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl py-2 text-sm font-bold transition">
      Isaac Sim
    </button>

    <button className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl py-2 text-sm font-bold transition">
      Twinia.AI
    </button>

    <button className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl py-2 text-sm font-bold transition">
      Cosmos
    </button>

    <button className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-xl py-2 text-sm font-bold transition">
      Datos Sinteticos
    </button>

  </div>
</div>
          </nav>

          <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-8 items-start mb-10">
            <div className="space-y-6">
              <div>
                <p className="text-[#76B900] font-bold mb-4">
                  PLATAFORMA DOCTORAL DE IA FÍSICA
                </p>

                <h2 className="text-5xl md:text-7xl font-black leading-tight mb-6">
                  Generador personalizado de entrenamiento robótico.
                </h2>

                <p className="text-zinc-300 text-lg leading-relaxed mb-8">
                  Cree pipelines personalizados para robots autónomos, gemelos
                  digitales, entrenamiento IA y generación de datos sintéticos.
                </p>

                <button
                  type="button"
                  onClick={crearExperimentoBackend}
                  className="bg-[#76B900] text-black px-7 py-4 rounded-xl font-bold hover:scale-105 transition"
                >
                  Crear experimento FastAPI
                </button>

                {backendStatus && (
                  <div className="mt-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-[#76B900] font-bold">
                      {backendStatus}
                    </p>

                    {experimentId && (
                      <p className="text-zinc-400 mt-2">
                        ID del experimento: {experimentId}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-zinc-950/80 border border-zinc-800 rounded-[2rem] p-6 shadow-2xl h-full w-full">
                <h3 className="text-2xl font-black mb-2">
                  Vista previa del ambiente
                </h3>

                <p className="text-zinc-400 mb-4 text-sm">
                  Visualización 3D del escenario seleccionado.
                </p>

                <div className="h-[605px] rounded-2xl overflow-hidden border border-zinc-800">
                  <EnvironmentViewer
                    escenario={escenario}
                    customEnvironmentUrl={
                      escenario === "Ambiente personalizado"
                        ? environmentPreview[0]?.url
                        : undefined
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-[2rem] p-5 shadow-2xl">
                <RobotViewer
                  robot={robot}
                  customModelUrl={
                    robot === "Robot personalizado" ? robotPreview[0]?.url : undefined
                  }
                />

                <div className="grid grid-cols-3 gap-3 mt-4">
                  <Badge title="Sim" value="Isaac Sim" />
                  <Badge title="Data" value="Cosmos" />
                  <Badge title="Backend" value="FastAPI" />
                </div>
              </div>

              <div className="bg-zinc-950/80 border border-zinc-800 rounded-[2rem] p-6 shadow-2xl h-full w-full">
                <div className="h-[680px] w-full rounded-2xl overflow-hidden border border-zinc-800">
                  <ModelViewer ia={ia} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6 items-stretch w-full max-w-[1600px] mx-auto mt-2">
            <div className="bg-zinc-950/90 border border-zinc-800 rounded-[1.7rem] p-4 w-full h-full">
              <h3 className="text-[32px] font-black leading-none mb-2">
                Configuración experimental
              </h3>

              <p className="text-zinc-400 mb-4 text-sm">
                Personalice el pipeline robótico.
              </p>

              <div className="grid md:grid-cols-2 gap-3">
                <Selector
                  label="Robot"
                  value={robot}
                  setValue={(value) => {
                    setRobot(value);

                    if (value !== "Robot personalizado") {
                      setRobotFiles([]);
                    }
                  }}
                  options={[
                    "TWINIA",
                    "BRAZO",
                    "HUMANOIDE",
                    "Robot personalizado",
                  ]}
                />

                <Selector
                  label="Modelo IA"
                  value={ia}
                  setValue={setIa}
                  options={[
                    "YOLO",
                    "CNN",
                    "Reinforcement Learning",
                    "Segmentación",
                    "Seguimiento de línea",
                  ]}
                />

                  <Selector
                    label="Ambiente"
                    value={escenario}
                    setValue={(value) => {
                      setEscenario(value);

                      if (value !== "Ambiente personalizado") {
                        setEnvironmentFiles([]);
                      }
                    }}
                    options={[
                      "Parque urbano",
                      "Hospital",
                      "Ciudad",
                      "Universidad",
                      "Ambiente personalizado",
                    ]}
                  />

                  <Selector
                    label="Sensor"
                    value={sensor}
                    setValue={setSensor}
                    options={["RGB", "RGB-D", "LiDAR", "Ultrasonido"]}
                  />
              </div>

              <Panel title="Flujo experimental">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {[
                    "Solo simulación",
                    "Generar dataset sintético",
                    "Entrenar modelo IA",
                    "Ejecutar inferencia",
                    "Validar Sim-to-Real",
                  ].map((modo, index) => (
                    <button
                      key={modo}
                      type="button"
                      onClick={() => aplicarModoTrabajo(modo)}
                      className={`text-left rounded-2xl border p-4 transition hover:scale-[1.02] ${
                        modoTrabajo === modo
                          ? "border-[#76B900] bg-[#76B900]/15 text-white"
                          : "border-zinc-800 bg-zinc-950 text-zinc-400"
                      }`}
                    >
                      <p className="text-[#76B900] font-black text-sm mb-2">
                        Fase {index + 1}
                      </p>

                      <p className="font-bold text-sm leading-tight">{modo}</p>
                    </button>
                  ))}
                </div>

                <div className="mt-4 grid md:grid-cols-2 gap-3">
                  <Selector
                    label="Tipo de validación"
                    value={validationMode}
                    setValue={setValidationMode}
                    options={[
                      "Sim-to-Real",
                      "Real-to-Sim",
                      "Simulado",
                      "Real",
                      "Híbrido DSR",
                    ]}
                  />

                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                    <p className="text-zinc-400 text-sm mb-1">
                      Estado del flujo
                    </p>

                    <p className="text-[#76B900] font-black">{modoTrabajo}</p>
                  </div>
                </div>

                <ControlSlider
                  label="Tamaño del dataset"
                  value={datasetSize}
                  min={100}
                  max={10000}
                  step={100}
                  onChange={setDatasetSize}
                />

                <ControlSlider
                  label="Épocas de entrenamiento"
                  value={trainingEpochs}
                  min={1}
                  max={300}
                  step={1}
                  onChange={setTrainingEpochs}
                />
              </Panel>

              <Panel title="Métricas esperadas">
                <ControlSlider
                  label="mAP esperado (%)"
                  value={expectedMap}
                  min={0}
                  max={100}
                  step={1}
                  onChange={setExpectedMap}
                />

                <ControlSlider
                  label="Precisión esperada (%)"
                  value={expectedPrecision}
                  min={0}
                  max={100}
                  step={1}
                  onChange={setExpectedPrecision}
                />

                <ControlSlider
                  label="Recall esperado (%)"
                  value={expectedRecall}
                  min={0}
                  max={100}
                  step={1}
                  onChange={setExpectedRecall}
                />

                <ControlSlider
                  label="FPS esperado"
                  value={expectedFps}
                  min={1}
                  max={120}
                  step={1}
                  onChange={setExpectedFps}
                />

                <ControlSlider
                  label="Reducción Sim-to-Real (%)"
                  value={simToRealReduction}
                  min={0}
                  max={100}
                  step={1}
                  onChange={setSimToRealReduction}
                />
              </Panel>
              <UploadBox
                title="Robot personalizado"
                description=".glb .gltf recomendado para vista previa 3D"
                onChange={(files) => {
                  setRobotFiles(files);

                  if (files.length > 0) {
                    setRobot("Robot personalizado");
                  }
                }}
              />

              <PreviewGrid title="Archivos de robot" files={robotPreview} />

                <UploadBox
                  title="Ambiente personalizado"
                  description=".glb .gltf recomendado para vista previa 3D"
                  onChange={(files) => {
                    setEnvironmentFiles(files);

                    if (files.length > 0) {
                      setEscenario("Ambiente personalizado");
                    }
                  }}
                />

              <PreviewGrid
                title="Archivos de ambiente"
                files={environmentPreview}
              />

              <UploadBox
                title="Dataset / Data sintética"
                description="Imágenes, videos, labels, ZIP."
                onChange={(files) => {

                  setDatasetFiles(files);

                  let images = 0;
                  let videos = 0;
                  let labels = 0;
                  let zips = 0;
                  let totalSize = 0;

                  files.forEach((file) => {

                    const name = file.name.toLowerCase();

                    totalSize += file.size;

                    if (
                      name.endsWith(".jpg") ||
                      name.endsWith(".png") ||
                      name.endsWith(".jpeg")
                    ) {
                      images++;
                    }

                    if (
                      name.endsWith(".mp4") ||
                      name.endsWith(".avi") ||
                      name.endsWith(".mov")
                    ) {
                      videos++;
                    }

                    if (
                      name.endsWith(".txt") ||
                      name.endsWith(".json") ||
                      name.endsWith(".xml")
                    ) {
                      labels++;
                    }

                    if (name.endsWith(".zip")) {
                      zips++;
                    }
                  });

                  setDatasetInfo({
                    totalImages: images,
                    totalVideos: videos,
                    totalLabels: labels,
                    totalZip: zips,
                    totalSizeMB: Number((totalSize / 1024 / 1024).toFixed(2)),
                    datasetReady: files.length > 0,
                  });
                }}
              />

              <PreviewGrid title="Archivos dataset" files={datasetPreview} />
              {datasetInfo.datasetReady && (

                  <div className="mt-4 bg-zinc-950 border border-[#76B900]/40 rounded-2xl p-4">

                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[#76B900] font-black text-lg">
                        Dataset analizado
                      </h4>

                      <div className="bg-[#76B900] text-black px-4 py-1 rounded-full font-bold text-sm">
                        LISTO
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">

                      <div className="bg-black rounded-xl p-3 border border-zinc-800">
                        <p className="text-zinc-500 text-xs">Imágenes</p>
                        <p className="font-black text-xl">
                          {datasetInfo.totalImages}
                        </p>
                      </div>

                      <div className="bg-black rounded-xl p-3 border border-zinc-800">
                        <p className="text-zinc-500 text-xs">Videos</p>
                        <p className="font-black text-xl">
                          {datasetInfo.totalVideos}
                        </p>
                      </div>

                      <div className="bg-black rounded-xl p-3 border border-zinc-800">
                        <p className="text-zinc-500 text-xs">Labels</p>
                        <p className="font-black text-xl">
                          {datasetInfo.totalLabels}
                        </p>
                      </div>

                      <div className="bg-black rounded-xl p-3 border border-zinc-800">
                        <p className="text-zinc-500 text-xs">ZIP</p>
                        <p className="font-black text-xl">
                          {datasetInfo.totalZip}
                        </p>
                      </div>

                      <div className="bg-black rounded-xl p-3 border border-zinc-800">
                        <p className="text-zinc-500 text-xs">Tamaño</p>
                        <p className="font-black text-xl">
                          {datasetInfo.totalSizeMB} MB
                        </p>
                      </div>

                    </div>

                    <div className="mt-4 bg-black border border-zinc-800 rounded-xl p-3">
                      <p className="text-[#76B900] font-bold">
                        Dataset listo para entrenamiento IA
                      </p>

                      <p className="text-zinc-400 text-sm mt-1">
                        Los archivos se asociarán automáticamente al experimento FastAPI.
                      </p>
                    </div>

                  </div>

                )}

<Panel title="NVIDIA Cosmos">
  <div className="flex items-center justify-between gap-4 mb-4">
    <p className="text-zinc-400 text-sm">
      Generación sintética, prompts inteligentes y validación Sim-to-Real.
    </p>

    <button
      type="button"
      onClick={() => setCosmos(!cosmos)}
      className={`px-5 py-2 rounded-full font-bold transition ${
        cosmos ? "bg-[#76B900] text-black" : "bg-zinc-800 text-zinc-300"
      }`}
    >
      {cosmos ? "Activado" : "Desactivado"}
    </button>
  </div>

  <div className="grid md:grid-cols-3 gap-3 mb-4">
    <button
      type="button"
      onClick={generarPromptCosmos}
      className="bg-[#76B900] text-black rounded-xl p-3 font-black"
    >
      Generar prompt IA
    </button>

    <button
      type="button"
      onClick={estimarCosmos}
      className="bg-zinc-900 border border-[#76B900] text-[#76B900] rounded-xl p-3 font-black"
    >
      Estimar dataset
    </button>

    <button
      type="button"
      onClick={aplicarDSR}
      className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 font-black"
    >
      Aplicar DSR
    </button>
  </div>

  <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
    {Object.entries(cosmosOptions).map(([key, value]) => (
      <button
        key={key}
        type="button"
        onClick={() =>
          setCosmosOptions({
            ...cosmosOptions,
            [key]: !value,
          })
        }
        className={`rounded-xl p-3 text-sm font-bold border ${
          value
            ? "bg-[#76B900]/20 border-[#76B900] text-white"
            : "bg-black border-zinc-800 text-zinc-500"
        }`}
      >
        {value ? "✓ " : "+ "}
        {key}
      </button>
    ))}
  </div>

  <textarea
    value={cosmosPrompt}
    onChange={(e) => setCosmosPrompt(e.target.value)}
    className="w-full min-h-32 bg-zinc-900 border border-zinc-700 rounded-2xl p-3 outline-none focus:border-[#76B900]"
  />

  <div className="mt-4 grid md:grid-cols-4 gap-3">
    <Info label="Imágenes estimadas" value={`${cosmosEstimate.images}`} />
    <Info label="Videos sintéticos" value={`${cosmosEstimate.videos}`} />
    <Info label="Tamaño estimado" value={`${cosmosEstimate.sizeGB} GB`} />
    <Info label="Tiempo GPU" value={`${cosmosEstimate.gpuHours} h`} />
  </div>

  <div className="mt-4 bg-black border border-zinc-800 rounded-2xl p-4">
    <h4 className="text-[#76B900] font-black mb-3">
      Pipeline Cosmos → Isaac Sim → IA
    </h4>

    <div className="grid md:grid-cols-5 gap-2 text-center text-sm font-bold">
      <div className="bg-zinc-900 rounded-xl p-3">Cosmos</div>
      <div className="bg-zinc-900 rounded-xl p-3">Datos sintéticos</div>
      <div className="bg-zinc-900 rounded-xl p-3">Isaac Sim</div>
      <div className="bg-zinc-900 rounded-xl p-3">{ia}</div>
      <div className="bg-zinc-900 rounded-xl p-3">Sim-to-Real</div>
    </div>
  </div>

  <div className="mt-4 grid md:grid-cols-4 gap-3">
    <Info label="mAP Cosmos" value={`${cosmosEstimate.map}%`} />
    <Info label="Precisión Cosmos" value={`${cosmosEstimate.precision}%`} />
    <Info label="Recall Cosmos" value={`${cosmosEstimate.recall}%`} />
    <Info label="Brecha Sim-to-Real" value={`${cosmosEstimate.simToReal}%`} />
  </div>

  <div className="mt-4 bg-black border border-[#76B900]/40 rounded-2xl p-4">
    <h4 className="text-[#76B900] font-black mb-2">
      Distribución DSR recomendada
    </h4>

    <div className="grid md:grid-cols-3 gap-3">
      <div className="bg-zinc-900 rounded-xl p-3">
        <p className="text-zinc-400 text-sm">Isaac Sim</p>
        <p className="font-black text-xl">70%</p>
      </div>

      <div className="bg-zinc-900 rounded-xl p-3">
        <p className="text-zinc-400 text-sm">Cosmos</p>
        <p className="font-black text-xl">20%</p>
      </div>

      <div className="bg-zinc-900 rounded-xl p-3">
        <p className="text-zinc-400 text-sm">Datos reales</p>
        <p className="font-black text-xl">10%</p>
      </div>
    </div>
  </div>

    <div className="mt-4 bg-[#76B900]/10 border border-[#76B900]/40 rounded-2xl p-4">
      <p className="text-[#76B900] font-black">
        Configuración Cosmos lista para guardar
      </p>

      <p className="text-zinc-400 text-sm mt-1">
        Esta información se guardará automáticamente al crear el experimento FastAPI.
      </p>
    </div>
</Panel>
            </div>

            <div className="bg-zinc-950/90 border border-zinc-800 rounded-[2rem] p-5 w-full h-full xl:justify-self-stretch">
              <h3 className="text-3xl font-black mb-5 -mt-1">Resumen</h3>

              <div className="space-y-3">
                <Info label="Robot" value={robot} />
                <Info label="IA" value={ia} />
                <Info label="Ambiente" value={escenario} />
                <Info label="Sensor" value={sensor} />
                <Info label="Cosmos" value={cosmos ? "Sí" : "No"} />
                <Info label="Modo" value={modoTrabajo} />
                <Info label="Dataset" value={`${datasetSize} muestras`} />
                <Info label="Épocas" value={`${trainingEpochs}`} />
                <Info label="Validación" value={validationMode} />
                <Info label="mAP" value={`${expectedMap}%`} />
                <Info label="Precisión" value={`${expectedPrecision}%`} />
                <Info label="Recall" value={`${expectedRecall}%`} />
                <Info label="FPS" value={`${expectedFps}`} />
                <Info
                  label="Sim-to-Real"
                  value={`${simToRealReduction}% reducción`}
                />
                <Info label="Archivos robot" value={`${robotFiles.length}`} />
                <Info
                  label="Archivos ambiente"
                  value={`${environmentFiles.length}`}
                />
                <Info label="Archivos dataset" value={`${datasetFiles.length}`} />
              </div>

              <button
                type="button"
                onClick={crearExperimentoBackend}
                className="w-full mt-6 bg-[#76B900] text-black p-4 rounded-2xl font-black hover:scale-105 transition"
              >
                Crear experimento FastAPI
              </button>

              <button
                type="button"
                onClick={listarExperimentos}
                className="w-full mt-3 bg-black border border-[#76B900] text-[#76B900] p-4 rounded-2xl font-black hover:bg-[#76B900] hover:text-black transition"
              >
                Listar experimentos
              </button>

              {backendStatus && (
                <div className="mt-5 bg-black border border-zinc-800 rounded-2xl p-4">
                  <p className="text-[#76B900] font-bold">{backendStatus}</p>

                  {experimentId && (
                    <p className="text-zinc-400 mt-2 break-all">
                      {experimentId}
                    </p>
                  )}
                </div>
              )}

              {experiments.length > 0 && (
                <div className="mt-5 bg-black border border-zinc-800 rounded-2xl p-4">
                  <h4 className="text-lg font-bold mb-4">
                    Experimentos creados
                  </h4>

                  <div className="space-y-3">
                    {experiments.map((exp) => (
                      <div
                        key={exp.experiment_id}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm"
                      >
                        <p className="font-bold text-[#76B900]">
                          ID: {exp.experiment_id}
                        </p>

                        <p>Robot: {exp.robot}</p>
                        <p>IA: {exp.ia}</p>
                        <p>Escenario: {exp.escenario}</p>
                        <p>Sensor: {exp.sensor}</p>
                        <p>Modo: {exp.modo_trabajo}</p>

                        <button
                          type="button"
                          onClick={() => verReporte(exp.experiment_id)}
                          className="mt-3 w-full bg-[#76B900] text-black px-4 py-2 rounded-xl font-bold hover:scale-105 transition"
                        >
                          Ver reporte
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Selector({
  label,
  value,
  setValue,
  options,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-zinc-300 mb-1 font-semibold text-sm">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 text-sm outline-none focus:border-[#76B900]"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function ControlSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="mt-4">
      <div className="flex justify-between mb-1">
        <label className="text-zinc-300 font-semibold text-sm">{label}</label>
        <span className="text-[#76B900] font-bold text-sm">{value}</span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#76B900]"
      />
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 bg-black border border-zinc-800 rounded-2xl p-3">
      <h4 className="text-base font-bold mb-3">{title}</h4>
      {children}
    </div>
  );
}

function UploadBox({
  title,
  description,
  onChange,
}: {
  title: string;
  description: string;
  onChange: (files: File[]) => void;
}) {
  return (
    <div className="mt-4 bg-black border border-zinc-800 rounded-2xl p-3">
      <h4 className="text-base font-bold mb-2">{title}</h4>

      <p className="text-zinc-400 mb-3 text-sm">{description}</p>

      <input
        type="file"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files || []);

          onChange(files);

          e.target.value = "";
        }}
        className="block w-full text-sm text-zinc-300
        file:mr-3
        file:rounded-xl
        file:border-0
        file:bg-[#76B900]
        file:px-3
        file:py-2
        file:font-bold
        file:text-black"
      />
    </div>
  );
}

function PreviewGrid({
  title,
  files,
}: {
  title: string;
  files: {
    name: string;
    type: string;
    url: string;
  }[];
}) {
  return (
    <div className="mt-4">
      <h4 className="text-base font-bold mb-2">{title}</h4>

      <div className="grid md:grid-cols-2 gap-3">
        {files.length === 0 && (
          <div className="text-zinc-500 text-sm">No hay archivos cargados.</div>
        )}

        {files.map((file, index) => (
          <div
            key={index}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3"
          >
            {file.type.startsWith("image") && (
              <img
                src={file.url}
                alt={file.name}
                className="h-28 w-full object-cover rounded-xl mb-2"
              />
            )}

            <p className="font-bold break-all text-sm">{file.name}</p>

            <p className="text-zinc-400 text-xs">{file.type || "Archivo"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-900 rounded-2xl p-3.5 border border-zinc-800">
      <p className="text-zinc-500 text-sm">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}

function Badge({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-zinc-900 rounded-2xl p-3.5">
      <p className="text-zinc-400 text-sm">{title}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}