"use client";

import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Grid,
  useGLTF,
  Bounds,
  Center,
} from "@react-three/drei";

type EnvironmentViewerProps = {
  escenario: string;
  customEnvironmentUrl?: string;
};

const environmentModels: Record<string, string> = {
  "Parque urbano": "/ambientes/garciame_opt.glb",
  Universidad: "/ambientes/UNAB+1.glb",
};

const environmentScale: Record<string, number> = {
  "Parque urbano": 6,
  Universidad: 1,
};

function EnvironmentModel({
  escenario,
  customEnvironmentUrl,
}: {
  escenario: string;
  customEnvironmentUrl?: string;
}) {
  const environmentPath =
    customEnvironmentUrl || environmentModels[escenario] || "/ambientes/garciame_opt.glb";

  const model = useGLTF(environmentPath);

  return (
    <Bounds fit clip observe margin={1.2}>
      <Center>
        <primitive
          object={model.scene}
          scale={customEnvironmentUrl ? 1 : environmentScale[escenario] || 1}
          position={[0, 0, 0]}
          rotation={customEnvironmentUrl ? [0, 0, 0] : [0, Math.PI / 2, 0]}
        />
      </Center>
    </Bounds>
  );
}

export default function EnvironmentViewer({
  escenario,
  customEnvironmentUrl,
}: EnvironmentViewerProps) {
  return (
    <div className="h-[450px] w-full rounded-3xl overflow-hidden border border-zinc-800 bg-black">
      <Canvas
        shadows
        camera={{
          position: [6, 4, 6],
          fov: 45,
        }}
      >
        <color attach="background" args={["#050505"]} />

        <ambientLight intensity={1} />

        <directionalLight castShadow position={[8, 12, 8]} intensity={1.6} />

        <spotLight position={[-8, 10, 8]} intensity={0.8} color="#76B900" />

        <pointLight position={[0, 6, -6]} intensity={0.5} color="#3b82f6" />

        <Grid
          position={[0, -0.01, 0]}
          args={[80, 80]}
          cellColor="#1f1f1f"
          sectionColor="#76B900"
          fadeDistance={60}
          fadeStrength={1}
        />

        <EnvironmentModel
          escenario={escenario}
          customEnvironmentUrl={customEnvironmentUrl}
        />

        <Environment preset="warehouse" environmentIntensity={0.4} />

        <OrbitControls
          makeDefault
          enablePan
          enableZoom
          enableRotate
          minDistance={5}
          maxDistance={60}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/ambientes/garciame_opt.glb");
useGLTF.preload("/ambientes/UNAB+1.glb");