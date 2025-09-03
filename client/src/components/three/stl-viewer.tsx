import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import * as THREE from "three";
import { Axis3d, RotateCcw } from "lucide-react";

interface STLViewerProps {
  fileUrl?: string;
  analysis?: {
    dimensions_mm: [number, number, number];
    volume_mm3: number;
    surface_area_mm2: number;
    estimated_weight_g: number;
    estimated_print_time_minutes: number;
  };
  className?: string;
}

function STLModel({ url }: { url: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useLoader(STLLoader, url);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  useEffect(() => {
    if (geometry) {
      geometry.computeBoundingBox();
      geometry.center();
    }
  }, [geometry]);

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial color="#4f46e5" />
    </mesh>
  );
}

export function STLViewer({ fileUrl, analysis, className }: STLViewerProps) {
  const [error, setError] = useState<string | null>(null);
  const controlsRef = useRef<any>(null);

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  if (!fileUrl) {
    return (
      <div className={`bg-gradient-to-br from-muted to-accent/50 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Axis3d className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground mb-2">STL dosyası yüklendiğinde</p>
          <p className="text-muted-foreground">3D önizleme burada görünecek</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-muted/50 flex items-center justify-center ${className}`}>
        <div className="text-center text-destructive">
          <p>3D model yüklenemedi</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} data-testid="stl-viewer">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={resetCamera}
          className="p-2 bg-card/80 backdrop-blur-sm rounded-md shadow-md hover:bg-card transition-colors"
          data-testid="button-reset-camera"
          title="Kamerayı sıfırla"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
      
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 100]} />
        <OrbitControls ref={controlsRef} enablePan={true} enableZoom={true} />
        
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.4} />
        
        <STLModel url={fileUrl} />
      </Canvas>

      {analysis && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-muted/30 backdrop-blur-sm">
          <h4 className="font-medium text-card-foreground mb-3">Model Analizi</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Boyutlar:</span>
              <span className="ml-2 text-card-foreground" data-testid="text-dimensions">
                {analysis.dimensions_mm.map(d => d.toFixed(1)).join('×')} mm
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Hacim:</span>
              <span className="ml-2 text-card-foreground" data-testid="text-volume">
                {(analysis.volume_mm3 / 1000).toFixed(1)} cm³
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Ağırlık:</span>
              <span className="ml-2 text-card-foreground" data-testid="text-weight">
                ~{analysis.estimated_weight_g.toFixed(1)} gram
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Baskı Süresi:</span>
              <span className="ml-2 text-card-foreground" data-testid="text-print-time">
                ~{(analysis.estimated_print_time_minutes / 60).toFixed(1)} saat
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
