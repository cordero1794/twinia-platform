"use client";

type ModelViewerProps = {
  ia: string;
};

type ModelInfo = {
  title: string;
  libraries: string[];
  code: string;
  explanation: string[];
};

const modelExamples: Record<string, ModelInfo> = {
  YOLO: {
    title: "YOLO — Detección de objetos",
    libraries: ["ultralytics", "opencv-python", "torch"],
    code: `from ultralytics import YOLO
import cv2

# 1. Cargar modelo preentrenado YOLOv8
model = YOLO("yolov8n.pt")

# 2. Leer imagen o frame de cámara
image = cv2.imread("escena_robotica.jpg")

# 3. Ejecutar inferencia
results = model.predict(
    source=image,
    conf=0.50,
    imgsz=640
)

# 4. Mostrar resultados
annotated_frame = results[0].plot()

cv2.imshow("Detección YOLO - TWINIA", annotated_frame)
cv2.waitKey(0)
cv2.destroyAllWindows()`,
    explanation: [
      "YOLO permite detectar objetos en tiempo real dentro de imágenes o video.",
      "model = YOLO(...) carga un modelo preentrenado.",
      "conf=0.50 define el umbral mínimo de confianza.",
      "results[0].plot() genera la imagen con cajas de detección.",
      "En TWINIA puede usarse para detectar obstáculos, señales, personas o líneas podotáctiles.",
    ],
  },

  CNN: {
    title: "CNN — Clasificación de imágenes",
    libraries: ["tensorflow", "keras", "numpy"],
    code: `import tensorflow as tf

# 1. Crear red neuronal convolucional
model = tf.keras.Sequential([
    tf.keras.layers.Conv2D(
        32,
        (3, 3),
        activation="relu",
        input_shape=(224, 224, 3)
    ),

    tf.keras.layers.MaxPooling2D(pool_size=(2, 2)),

    tf.keras.layers.Conv2D(
        64,
        (3, 3),
        activation="relu"
    ),

    tf.keras.layers.MaxPooling2D(pool_size=(2, 2)),

    tf.keras.layers.Flatten(),

    tf.keras.layers.Dense(
        128,
        activation="relu"
    ),

    tf.keras.layers.Dense(
        4,
        activation="softmax"
    )
])

# 2. Compilar modelo
model.compile(
    optimizer="adam",
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

# 3. Entrenar modelo
model.fit(
    train_dataset,
    validation_data=val_dataset,
    epochs=50
)`,
    explanation: [
      "Una CNN aprende patrones visuales como bordes, formas y texturas.",
      "Conv2D extrae características de la imagen.",
      "MaxPooling2D reduce el tamaño espacial y conserva información importante.",
      "Dense clasifica la imagen en una categoría final.",
      "En TWINIA puede clasificar tipos de terreno, señales, objetos o estados del entorno.",
    ],
  },

  "Reinforcement Learning": {
    title: "Reinforcement Learning — Aprendizaje por refuerzo",
    libraries: ["gymnasium", "stable-baselines3", "torch"],
    code: `import gymnasium as gym
from stable_baselines3 import PPO

# 1. Crear ambiente de simulación
env = gym.make("CartPole-v1")

# 2. Crear agente PPO
model = PPO(
    policy="MlpPolicy",
    env=env,
    learning_rate=0.0003,
    verbose=1
)

# 3. Entrenar agente
model.learn(
    total_timesteps=100000
)

# 4. Guardar modelo entrenado
model.save("twinia_rl_agent")

# 5. Probar agente
obs, _ = env.reset()

for step in range(1000):
    action, _ = model.predict(obs)
    obs, reward, terminated, truncated, info = env.step(action)

    if terminated or truncated:
        obs, _ = env.reset()`,
    explanation: [
      "El aprendizaje por refuerzo entrena un agente mediante recompensas.",
      "env representa el entorno donde actúa el robot.",
      "PPO es un algoritmo robusto para control y navegación.",
      "model.learn(...) ejecuta el proceso de entrenamiento.",
      "En TWINIA puede usarse para caminar, evitar obstáculos o aprender trayectorias autónomas.",
    ],
  },

  Segmentación: {
    title: "Segmentación — Máscaras de objetos",
    libraries: ["ultralytics", "opencv-python", "torch"],
    code: `from ultralytics import YOLO
import cv2

# 1. Cargar modelo de segmentación
model = YOLO("yolov8n-seg.pt")

# 2. Cargar imagen
image_path = "escena_urbana.jpg"

# 3. Ejecutar segmentación
results = model.predict(
    source=image_path,
    task="segment",
    conf=0.45
)

# 4. Visualizar máscaras
segmented_image = results[0].plot()

cv2.imshow("Segmentación - TWINIA", segmented_image)
cv2.waitKey(0)
cv2.destroyAllWindows()`,
    explanation: [
      "La segmentación identifica regiones exactas de una imagen.",
      "A diferencia de YOLO estándar, no solo dibuja cajas, también genera máscaras.",
      "task='segment' activa la salida de segmentación.",
      "conf=0.45 filtra predicciones poco confiables.",
      "En TWINIA puede separar andenes, obstáculos, personas, zonas transitables o líneas podotáctiles.",
    ],
  },

  "Seguimiento de línea": {
    title: "Seguimiento de línea — Visión clásica",
    libraries: ["opencv-python", "numpy"],
    code: `import cv2
import numpy as np

# 1. Leer imagen o frame de cámara
frame = cv2.imread("linea_podotactil.jpg")

# 2. Convertir a escala de grises
gray = cv2.cvtColor(
    frame,
    cv2.COLOR_BGR2GRAY
)

# 3. Aplicar umbral
_, binary = cv2.threshold(
    gray,
    120,
    255,
    cv2.THRESH_BINARY
)

# 4. Encontrar contornos
contours, _ = cv2.findContours(
    binary,
    cv2.RETR_EXTERNAL,
    cv2.CHAIN_APPROX_SIMPLE
)

# 5. Seleccionar contorno principal
largest = max(contours, key=cv2.contourArea)

# 6. Calcular centro de la línea
M = cv2.moments(largest)

cx = int(M["m10"] / M["m00"])

# 7. Decisión de navegación
image_center = frame.shape[1] // 2

if cx < image_center - 30:
    action = "Girar izquierda"
elif cx > image_center + 30:
    action = "Girar derecha"
else:
    action = "Avanzar"

print(action)`,
    explanation: [
      "Este modelo usa visión clásica para seguir líneas o guías visuales.",
      "cv2.cvtColor convierte la imagen para facilitar el procesamiento.",
      "threshold separa la línea del fondo.",
      "findContours detecta las regiones principales.",
      "El centroide cx permite decidir si el robot avanza, gira a la izquierda o derecha.",
      "En TWINIA puede aplicarse al seguimiento de líneas podotáctiles.",
    ],
  },
};

export default function ModelViewer({ ia }: ModelViewerProps) {
  const selected = modelExamples[ia] || modelExamples["YOLO"];

  return (
    <div className="h-[550px] w-full rounded-3xl overflow-hidden border border-zinc-800 bg-black p-6">
      <div className="flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">
        <div className="border-b border-zinc-800 p-5">
          <p className="text-[#76B900] text-sm font-bold mb-2">
            MODELO IA SELECCIONADO
          </p>

          <h3 className="text-2xl font-black">{selected.title}</h3>

          <p className="text-zinc-400 text-sm mt-2">
            Ejemplo técnico en Python para orientar la configuración del
            experimento.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-0 flex-1 min-h-0">
          <div className="md:col-span-2 border-r border-zinc-800 min-h-0">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
              <span className="text-sm font-bold text-zinc-300">
                ejemplo_modelo.py
              </span>

              <span className="rounded-full bg-[#76B900] px-3 py-1 text-xs font-bold text-black">
                Python
              </span>
            </div>

            <pre className="h-full overflow-auto p-5 text-sm leading-7 text-zinc-300 whitespace-pre-wrap">
              <code>{selected.code}</code>
            </pre>
          </div>

          <div className="min-h-0 overflow-auto p-5">
            <h4 className="text-[#76B900] font-black mb-3">
              Librerías requeridas
            </h4>

            <div className="space-y-2 mb-6">
              {selected.libraries.map((lib) => (
                <div
                  key={lib}
                  className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm font-bold"
                >
                  {lib}
                </div>
              ))}
            </div>

            <h4 className="text-[#76B900] font-black mb-3">
              Explicación clave
            </h4>

            <ul className="space-y-3 text-sm text-zinc-300">
              {selected.explanation.map((item, index) => (
                <li
                  key={index}
                  className="rounded-xl border border-zinc-800 bg-black p-3"
                >
                  <span className="text-[#76B900] font-black">
                    {index + 1}.
                  </span>{" "}
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 p-4 grid grid-cols-3 gap-3 text-xs">
          <Badge label="Entrada" value="Sensor / Dataset" />
          <Badge label="Proceso" value="Modelo IA" />
          <Badge label="Salida" value="Métrica / Acción" /> 
        </div>
      </div>
    </div>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black p-3">
      <p className="text-zinc-500">{label}</p>
      <p className="font-bold text-zinc-200">{value}</p>
    </div>
  );
}