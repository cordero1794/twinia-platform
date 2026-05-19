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

function RobotModel() {
  const model = useGLTF("/twinia.glb");

  return (
    <Bounds fit clip observe margin={1.1}>
      <Center>
        <primitive
          object={model.scene}
          scale={0.24}
          position={[0, -280, 0]}
          rotation={[0, Math.PI / 2, 0]}
        />
      </Center>
    </Bounds>
  );
}

export default function RobotViewer() {
  return (
    <div className="h-[550px] w-full rounded-3xl overflow-hidden border border-zinc-800 bg-black">

      <Canvas
        shadows
        camera={{
          position: [4, 2, 7],
          fov: 42,
        }}
      >
        <color attach="background" args={["#050505"]} />

        <fog attach="fog" args={["#050505", 12, 30]} />

        {/* Luz ambiente suave */}
        <ambientLight intensity={0.8} />

        {/* Luz principal blanca */}
        <directionalLight
          castShadow
          position={[5, 8, 5]}
          intensity={1.5}
          color="#ffffff"
        />

        {/* Luz verde NVIDIA suave */}
        <spotLight
          position={[-5, 6, 5]}
          intensity={1}
          color="#76B900"
        />

        {/* Luz azul cinematográfica */}
        <pointLight
          position={[0, 4, -4]}
          intensity={0.5}
          color="#3b82f6"
        />

        {/* Piso/grid */}
        <Grid
          position={[0, -2.5, 0]}
          args={[30, 30]}
          cellColor="#222222"
          sectionColor="#76B900"
          fadeDistance={40}
          fadeStrength={1}
        />

        <RobotModel />

        <Environment preset="warehouse" />

        <OrbitControls
          makeDefault
          enablePan
          enableZoom
          enableRotate
          minDistance={2}
          maxDistance={12}
        />

      </Canvas>

    </div>
  );
}

useGLTF.preload("/twinia.glb");