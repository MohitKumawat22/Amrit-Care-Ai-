"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Suspense } from "react";
import { Avatar } from "./Avatar";
import { Loader2 } from "lucide-react";

interface AvatarMessage {
  audio: HTMLAudioElement;
  lipSync: { mouthCues: { start: number; end: number; value: string }[] };
}

function AvatarFallback() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-teal-50/50 to-teal-100/30 text-teal-700">
      <Loader2 className="w-8 h-8 animate-spin mb-2 text-teal-600" />
      <span className="text-xs font-semibold uppercase tracking-wider text-teal-800">Loading 3D Doctor...</span>
    </div>
  );
}

export function AvatarScene({
  isTalking,
  currentMessage,
}: {
  isTalking: boolean;
  currentMessage?: AvatarMessage | null;
}) {
  return (
    <div className="w-full h-[380px] sm:h-[420px] rounded-2xl overflow-hidden relative border border-gray-200/80 bg-gradient-to-b from-slate-50 via-teal-50/40 to-slate-100 shadow-inner">
      <Suspense fallback={<AvatarFallback />}>
        <Canvas camera={{ position: [0, 1.4, 2.0], fov: 30 }} gl={{ alpha: true }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={1.1} castShadow />
          <pointLight position={[-5, 5, -5]} intensity={0.5} color="#2dd4bf" />
          <group position={[0, -0.5, 0]} scale={1.15}>
            <Avatar isTalking={isTalking} currentMessage={currentMessage} />
          </group>
          <Environment preset="city" />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.8}
            target={[0, 1.2, 0]}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}
