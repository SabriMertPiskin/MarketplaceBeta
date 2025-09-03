import { Axis3d } from "lucide-react";

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

export function STLViewer({ fileUrl, analysis, className }: STLViewerProps) {
  if (!fileUrl) {
    return (
      <div className={`bg-gradient-to-br from-muted to-accent/50 flex items-center justify-center ${className}`} data-testid="stl-viewer-placeholder">
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

  return (
    <div className={`bg-gradient-to-br from-muted to-accent/50 flex items-center justify-center ${className}`} data-testid="stl-viewer-loaded">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Axis3d className="w-8 h-8 text-primary" />
        </div>
        <p className="text-muted-foreground mb-2">3D Önizleme</p>
        <p className="text-sm text-muted-foreground">Model yüklendi: {fileUrl.split('/').pop()}</p>
        {analysis && (
          <div className="mt-4 text-left">
            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border">
              <h4 className="font-semibold mb-2">Model Analizi</h4>
              <div className="text-sm space-y-1">
                <div>Boyutlar: {analysis.dimensions_mm.map(d => d.toFixed(1)).join(' × ')} mm</div>
                <div>Hacim: {analysis.volume_mm3.toFixed(1)} mm³</div>
                <div>Yüzey Alanı: {analysis.surface_area_mm2.toFixed(1)} mm²</div>
                <div>Tahmini Ağırlık: {analysis.estimated_weight_g.toFixed(1)} g</div>
                <div>Tahmini Baskı Süresi: {Math.round(analysis.estimated_print_time_minutes)} dakika</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}