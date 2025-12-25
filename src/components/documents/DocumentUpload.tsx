import { useState, useCallback } from "react";
import { Upload, FileText, Mail, X, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadedFile {
  id: string;
  name: string;
  type: "pdf" | "email";
  size: string;
  status: "uploading" | "processing" | "complete" | "error";
  progress: number;
}

const mockFiles: UploadedFile[] = [
  { id: "1", name: "TechVentures_IC_Memo.pdf", type: "pdf", size: "2.4 MB", status: "complete", progress: 100 },
  { id: "2", name: "HealthCare_Due_Diligence.pdf", type: "pdf", size: "5.1 MB", status: "complete", progress: 100 },
  { id: "3", name: "IC_Discussion_Thread.eml", type: "email", size: "124 KB", status: "complete", progress: 100 },
];

export function DocumentUpload() {
  const [files, setFiles] = useState<UploadedFile[]>(mockFiles);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Simulate file upload
    const newFile: UploadedFile = {
      id: Date.now().toString(),
      name: "New_Document.pdf",
      type: "pdf",
      size: "1.2 MB",
      status: "uploading",
      progress: 0,
    };
    setFiles(prev => [...prev, newFile]);

    // Simulate upload progress
    const interval = setInterval(() => {
      setFiles(prev => prev.map(f => {
        if (f.id === newFile.id) {
          const newProgress = Math.min(f.progress + 20, 100);
          return {
            ...f,
            progress: newProgress,
            status: newProgress === 100 ? "complete" : "uploading",
          };
        }
        return f;
      }));
    }, 500);

    setTimeout(() => clearInterval(interval), 3000);
  }, []);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <h2 className="text-2xl font-semibold">Documents</h2>
        <p className="text-muted-foreground mt-1">Upload PDFs and emails from past investment committees</p>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 opacity-0 animate-fade-in",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-secondary/30"
        )}
        style={{ animationDelay: "100ms" }}
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium">Drop files here to upload</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Support for PDF documents and email files (.eml, .msg)
        </p>
        <Button variant="glow" className="mt-6">
          Browse Files
        </Button>
      </div>

      {/* File List */}
      <div className="space-y-3">
        <h3 className="font-semibold opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
          Uploaded Documents ({files.length})
        </h3>
        {files.map((file, index) => (
          <div
            key={file.id}
            className="glass glass-hover rounded-xl p-4 flex items-center gap-4 opacity-0 animate-fade-in"
            style={{ animationDelay: `${250 + index * 50}ms` }}
          >
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              file.type === "pdf" ? "bg-destructive/10 text-destructive" : "bg-info/10 text-info"
            )}>
              {file.type === "pdf" ? <FileText className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{file.size}</p>
            </div>
            <div className="flex items-center gap-3">
              {file.status === "uploading" && (
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                </div>
              )}
              {file.status === "complete" && (
                <CheckCircle className="w-5 h-5 text-success" />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => removeFile(file.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
