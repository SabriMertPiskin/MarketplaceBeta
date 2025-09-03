import { useState } from "react";
import { FileUpload } from "@/components/ui/file-upload";
import { STLViewer } from "@/components/three/stl-viewer";
import { PriceCalculator } from "@/components/pricing/price-calculator";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { STLAnalysis, PricingData } from "@/types";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysis, setAnalysis] = useState<STLAnalysis | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setAnalysis(null);
    setFileUrl(null);
    
    // Create local URL for preview
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    
    // Start upload
    await handleUpload(file);
  };

  const handleFileRemove = () => {
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
    setSelectedFile(null);
    setAnalysis(null);
    setFileUrl(null);
    setUploadProgress(0);
    setPricing(null);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadApi.uploadSTL(file, (progress) => {
        setUploadProgress(progress);
      });

      if (result.analysis) {
        setAnalysis(result.analysis);
      }

      toast({
        title: "Dosya yüklendi",
        description: "STL dosyanız başarıyla analiz edildi.",
      });
    } catch (error: any) {
      toast({
        title: "Yükleme hatası",
        description: error.message || "Dosya yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
      handleFileRemove();
    } finally {
      setUploading(false);
    }
  };

  const handleOrderSubmit = async () => {
    if (!selectedFile || !pricing) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen dosya yükleyin ve fiyat hesaplatın.",
        variant: "destructive",
      });
      return;
    }

    try {
      // TODO: Implement order creation API call
      toast({
        title: "Sipariş oluşturuldu",
        description: "Siparişiniz başarıyla oluşturuldu. Üretici onayını bekliyor.",
      });
    } catch (error: any) {
      toast({
        title: "Sipariş hatası",
        description: error.message || "Sipariş oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8" data-testid="upload-page">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-card-foreground mb-2">STL Dosyası Yükle</h2>
        <p className="text-muted-foreground">3D modelinizi yükleyin ve fiyat teklifi alın.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Area */}
        <div className="space-y-6">
          {/* File Upload */}
          {!selectedFile ? (
            <FileUpload
              onFileSelect={handleFileSelect}
              accept=".stl"
              maxSize={100 * 1024 * 1024} // 100MB
            />
          ) : (
            <FileUpload
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              selectedFile={selectedFile}
            />
          )}

          {/* Upload Progress */}
          {uploading && (
            <Card data-testid="upload-progress">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Yükleniyor...</span>
                    <span className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pricing Calculator */}
          {analysis && (
            <PriceCalculator
              onPriceChange={setPricing}
              productId="temp" // Temporary ID for calculation
            />
          )}
        </div>

        {/* 3D Preview Area */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-card-foreground">3D Önizleme</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <STLViewer
              fileUrl={fileUrl || undefined}
              analysis={analysis || undefined}
              className="h-96"
            />
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      {selectedFile && (
        <div className="flex justify-end space-x-4">
          <Button 
            variant="outline"
            onClick={() => {
              // TODO: Implement draft save
              toast({
                title: "Taslak kaydedildi",
                description: "Projeniz taslak olarak kaydedildi.",
              });
            }}
            data-testid="button-save-draft"
          >
            Taslak Kaydet
          </Button>
          <Button
            onClick={handleOrderSubmit}
            disabled={!pricing}
            data-testid="button-create-order"
          >
            Sipariş Ver
          </Button>
        </div>
      )}
    </div>
  );
}
