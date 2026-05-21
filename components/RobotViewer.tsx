"use client";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Grid,
  useGLTF,
  Bounds,
  Center,
} from "@react-three/drei";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

type RobotViewerProps = {
  robot: string;
  customModelUrl?: string;
};

const robotModels: Record<string, string> = {
  TWINIA: "/twinia.glb",
  BRAZO: "/BRAZO_opt.glb",
  HUMANOIDE: "/HUMANOIDE_opt.glb",
  "Robot personalizado": "/twinia.glb",
};

const robotScale: Record<string, number> = {
  TWINIA: 0.1,
  BRAZO: 0.85,
  HUMANOIDE: 1.05,
  "Robot personalizado": 1,
};

const robotRotation: Record<string, [number, number, number]> = {
  TWINIA: [0, Math.PI / 2, 0],
  BRAZO: [0, -Math.PI / 5, 0],
  HUMANOIDE: [0, Math.PI, 0],
  "Robot personalizado": [0, 0, 0],
};

const robotPosition: Record<string, [number, number, number]> = {
  TWINIA: [0, 0.7, 0],
  BRAZO: [0, 0, 0],
  HUMANOIDE: [0, 0, 0],
  "Robot personalizado": [0, 0, 0],
};

const robotGridY: Record<string, number> = {
  TWINIA: -1.15,
  BRAZO: -0.2,
  HUMANOIDE: -0.3,
  "Robot personalizado": -0.8,
};

const robotColors: Record<string, string | null> = {
  TWINIA: null,
  BRAZO: "#3b82f6",
  HUMANOIDE: "#ffffff",
  "Robot personalizado": null,
};

function RobotModel({
  robot,
  customModelUrl,
}: {
  robot: string;
  customModelUrl?: string;
}) {
  const modelPath = customModelUrl || robotModels[robot] || "/twinia.glb";
  const model = useGLTF(modelPath);
  const clonedScene = clone(model.scene);

  clonedScene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;

      if (!customModelUrl && robotColors[robot]) {
        mesh.material = new THREE.MeshStandardMaterial({
          color: robotColors[robot]!,
          metalness: 0.45,
          roughness: 0.38,
          emissive: new THREE.Color(robotColors[robot]!),
          emissiveIntensity: 0.03,
        });
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });

  return (
    <Bounds fit clip observe margin={1.25}>
      <Center>
        <primitive
          object={clonedScene}
          scale={customModelUrl ? 1 : robotScale[robot] || 1}
          position={
            customModelUrl ? [0, 0, 0] : robotPosition[robot] || [0, 0, 0]
          }
          rotation={
            customModelUrl ? [0, 0, 0] : robotRotation[robot] || [0, 0, 0]
          }
        />
      </Center>
    </Bounds>
  );
}

export default function RobotViewer({
  robot,
  customModelUrl,
}: RobotViewerProps) {
  return (
    <div className="h-[550px] w-full rounded-3xl overflow-hidden border border-zinc-800 bg-black">
      <Canvas
        shadows
        camera={{
          position: [5.5, 3.2, 7.5],
          fov: 38,
          near: 0.1,
          far: 100,
        }}
      >
        <color attach="background" args={["#050505"]} />

        <ambientLight intensity={0.85} />

        <directionalLight
          castShadow
          position={[4, 7, 6]}
          intensity={1.4}
          color="#ffffff"
        />

        <spotLight
          position={[-5, 5, 5]}
          intensity={0.65}
          angle={0.35}
          penumbra={0.6}
          color="#76B900"
        />

        <pointLight position={[0, 3, -4]} intensity={0.45} color="#3b82f6" />

        <Grid
          key={`grid-${robot}-${customModelUrl || "default"}`}
          position={[0, customModelUrl ? -0.8 : robotGridY[robot] ?? -1.15, 0]}
          args={[24, 24]}
          cellColor="#1f1f1f"
          sectionColor="#76B900"
          fadeDistance={28}
          fadeStrength={1.2}
        />

        <RobotModel robot={robot} customModelUrl={customModelUrl} />

        <Environment preset="warehouse" environmentIntensity={0.45} />

        <OrbitControls
          makeDefault
          target={[0, 0.15, 0]}
          enablePan={false}
          enableZoom
          enableRotate
          minDistance={2.5}
          maxDistance={18}
          minPolarAngle={Math.PI / 5}
          maxPolarAngle={Math.PI / 2.15}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/twinia.glb");
useGLTF.preload("/BRAZO_opt.glb");
useGLTF.preload("/HUMANOIDE_opt.glb");