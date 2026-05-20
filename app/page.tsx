"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";

const RobotViewer = dynamic(() => import("../components/RobotViewer"), {
  ssr: false,
});

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

  const [cosmosPrompt, setCosmosPrompt] = useState(
    "Robot cuadrúpedo caminando en un parque urbano con obstáculos reales y líneas podotáctiles."
  );

  const [robotFiles, setRobotFiles] = useState<File[]>([]);
  const [environmentFiles, setEnvironmentFiles] = useState<File[]>([]);
  const [datasetFiles, setDatasetFiles] = useState<File[]>([]);

  const [backendStatus, setBackendStatus] = useState("");
  const [experimentId, setExperimentId] = useState("");
  const [experiments, setExperiments] = useState<any[]>([]);

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

      robotFiles.forEach((file) => {
        formData.append("robot_files", file);
      });

      environmentFiles.forEach((file) => {
        formData.append("environment_files", file);
      });

      datasetFiles.forEach((file) => {
        formData.append("dataset_files", file);
      });

      const response = await fetch(`${BACKEND_URL}/create-experiment`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error en la respuesta del backend");
      }

      const data = await response.json();

      setExperimentId(data.experiment_id || "");
      setBackendStatus("Experimento creado correctamente en FastAPI");

      alert(`Experimento creado correctamente\n\nID: ${data.experiment_id}`);
    } catch (error) {
      console.error(error);
      setBackendStatus("Error conectando con el backend");
      alert("Error conectando con el backend online de Render.");
    }
  };

  const listarExperimentos = async () => {
    try {
      setBackendStatus("Consultando experimentos...");

      const response = await fetch(`${BACKEND_URL}/experiments`);

      if (!response.ok) {
        throw new Error("No se pudieron consultar los experimentos");
      }

      const data = await response.json();

      setExperiments(data.experiments || []);
      setBackendStatus(`Experimentos encontrados: ${data.total}`);
    } catch (error) {
      console.error(error);
      setBackendStatus("Error consultando experimentos");
      alert("Error consultando experimentos en Render.");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      <section className="relative px-8 py-10 max-w-7xl mx-auto">
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

            <button className="border border-[#76B900] text-[#76B900] px-5 py-2 rounded-full">
              Research Preview
            </button>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
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
                Crear experimento en backend
              </button>

              {backendStatus && (
                <div className="mt-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                  <p className="text-[#76B900] font-bold">{backendStatus}</p>
                  {experimentId && (
                    <p className="text-zinc-400 mt-2">
                      ID del experimento: {experimentId}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-zinc-950/80 border border-zinc-800 rounded-[2rem] p-6 shadow-2xl">
              <RobotViewer />

              <div className="grid grid-cols-3 gap-3 mt-5">
                <Badge title="Sim" value="Isaac Sim" />
                <Badge title="Data" value="Cosmos" />
                <Badge title="Backend" value="FastAPI" />
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-zinc-950/90 border border-zinc-800 rounded-[2rem] p-8">
              <h3 className="text-3xl font-black mb-2">
                Configuración experimental
              </h3>

              <p className="text-zinc-400 mb-8">
                Personalice el pipeline robótico.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <Selector
                  label="Robot"
                  value={robot}
                  setValue={setRobot}
                  options={["TWINIA", "Spot", "Unitree", "Robot personalizado"]}
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
                  setValue={setEscenario}
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
                <div className="grid md:grid-cols-2 gap-6">
                  <Selector
                    label="Modo de trabajo"
                    value={modoTrabajo}
                    setValue={setModoTrabajo}
                    options={[
                      "Solo simulación",
                      "Generar dataset sintético",
                      "Entrenar modelo IA",
                      "Ejecutar inferencia",
                      "Validar Sim-to-Real",
                    ]}
                  />

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
                description=".usd .urdf .obj .fbx .gltf .glb"
                onChange={setRobotFiles}
              />

              <PreviewGrid title="Archivos de robot" files={robotPreview} />

              <UploadBox
                title="Ambiente personalizado"
                description=".usd .usdz .obj .fbx .gltf .glb"
                onChange={setEnvironmentFiles}
              />

              <PreviewGrid
                title="Archivos de ambiente"
                files={environmentPreview}
              />

              <UploadBox
                title="Dataset / Data sintética"
                description="Imágenes, videos, labels, ZIP."
                onChange={setDatasetFiles}
              />

              <PreviewGrid title="Archivos dataset" files={datasetPreview} />

              <Panel title="NVIDIA Cosmos">
                <div className="flex items-center justify-between gap-5 mb-5">
                  <p className="text-zinc-400">
                    Prompt para generación de video sintético.
                  </p>

                  <button
                    type="button"
                    onClick={() => setCosmos(!cosmos)}
                    className={`px-6 py-3 rounded-full font-bold transition ${
                      cosmos
                        ? "bg-[#76B900] text-black"
                        : "bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    {cosmos ? "Activado" : "Desactivado"}
                  </button>
                </div>

                <textarea
                  value={cosmosPrompt}
                  onChange={(e) => setCosmosPrompt(e.target.value)}
                  className="w-full min-h-36 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 outline-none focus:border-[#76B900]"
                />
              </Panel>
            </div>

            <div className="bg-zinc-950/90 border border-zinc-800 rounded-[2rem] p-8">
              <h3 className="text-3xl font-black mb-6">Resumen</h3>

              <div className="space-y-4">
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
                <Info
                  label="Archivos dataset"
                  value={`${datasetFiles.length}`}
                />
              </div>

              <button
                type="button"
                onClick={crearExperimentoBackend}
                className="w-full mt-8 bg-[#76B900] text-black p-5 rounded-2xl font-black hover:scale-105 transition"
              >
                Crear experimento FastAPI
              </button>

              <button
                type="button"
                onClick={listarExperimentos}
                className="w-full mt-4 bg-black border border-[#76B900] text-[#76B900] p-5 rounded-2xl font-black hover:bg-[#76B900] hover:text-black transition"
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
                  <h4 className="text-xl font-bold mb-4">
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
      <label className="block text-zinc-300 mb-2 font-semibold">{label}</label>

      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4 outline-none focus:border-[#76B900]"
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
    <div className="mt-6">
      <div className="flex justify-between mb-2">
        <label className="text-zinc-300 font-semibold">{label}</label>
        <span className="text-[#76B900] font-bold">{value}</span>
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
    <div className="mt-8 bg-black border border-zinc-800 rounded-3xl p-6">
      <h4 className="text-xl font-bold mb-4">{title}</h4>
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
    <div className="mt-8 bg-black border border-zinc-800 rounded-3xl p-6">
      <h4 className="text-xl font-bold mb-2">{title}</h4>

      <p className="text-zinc-400 mb-4">{description}</p>

      <input
        type="file"
        multiple
        onChange={(e) => onChange(Array.from(e.target.files || []))}
        className="block w-full text-sm text-zinc-300 file:mr-4 file:rounded-xl file:border-0 file:bg-[#76B900] file:px-4 file:py-3 file:font-bold file:text-black"
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
    <div className="mt-6">
      <h4 className="text-xl font-bold mb-4">{title}</h4>

      <div className="grid md:grid-cols-2 gap-4">
        {files.length === 0 && (
          <div className="text-zinc-500">No hay archivos cargados.</div>
        )}

        {files.map((file, index) => (
          <div
            key={index}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
          >
            {file.type.startsWith("image") && (
              <img
                src={file.url}
                alt={file.name}
                className="h-32 w-full object-cover rounded-xl mb-3"
              />
            )}

            <p className="font-bold break-all">{file.name}</p>

            <p className="text-zinc-400 text-sm">{file.type || "Archivo"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
      <p className="text-zinc-500 text-sm">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}

function Badge({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-zinc-900 rounded-2xl p-4">
      <p className="text-zinc-400 text-sm">{title}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}