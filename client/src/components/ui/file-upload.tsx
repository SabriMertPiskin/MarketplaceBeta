import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  accept?: string;
  maxSize?: number;
  className?: string;
  selectedFile?: File | null;
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  accept = ".stl",
  maxSize = 100 * 1024 * 1024, // 100MB
  className,
  selectedFile,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        onFileSelect(file);
      }
      setIsDragOver(false);
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/sla": [".stl"] },
    maxSize,
    multiple: false,
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false),
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (selectedFile) {
    return (
      <div className={cn("bg-card rounded-lg p-6 border border-border", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <File className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-card-foreground">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          {onFileRemove && (
            <button
              onClick={onFileRemove}
              className="p-2 text-muted-foreground hover:text-destructive transition-colors"
              data-testid="button-remove-file"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "file-drop-zone bg-card rounded-lg p-8 text-center border-2 border-dashed cursor-pointer transition-all duration-300",
        isDragActive || isDragOver
          ? "border-primary bg-accent"
          : "border-border hover:border-primary hover:bg-accent",
        className
      )}
      data-testid="file-upload-zone"
    >
      <input {...getInputProps()} data-testid="input-file" />
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Upload className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-card-foreground mb-2">
        STL Dosyasını Sürükleyin
      </h3>
      <p className="text-muted-foreground mb-4">veya dosya seçmek için tıklayın</p>
      <button
        type="button"
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        data-testid="button-select-file"
      >
        Dosya Seç
      </button>
      <p className="text-xs text-muted-foreground mt-2">
        Maksimum dosya boyutu: {formatFileSize(maxSize)}
      </p>
    </div>
  );
}
