import { useState, useCallback, useRef } from "react";
import { Upload, FileText, Mail, X, CheckCircle, Loader2, AlertCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useDocuments } from "@/hooks/useDocuments";
import { DocumentSearch } from "./DocumentSearch";
import { DocumentViewer } from "./DocumentViewer";

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface SelectedSource {
  id: string;
  document_id: string;
  content: string;
  similarity: number;
  metadata: {
    filename?: string;
    deal_name?: string;
    ic_date?: string;
    chunk_index?: number;
    total_chunks?: number;
  };
}

export function DocumentUpload() {
  const { documents, isLoading, uploadDocument, deleteDocument } = useDocuments();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [selectedSource, setSelectedSource] = useState<SelectedSource | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFiles = async (files: FileList) => {
    for (const file of Array.from(files)) {
      const tempId = `temp-${Date.now()}-${file.name}`;
      setUploadingFiles(prev => new Set(prev).add(tempId));
      
      await uploadDocument(file);
      
      setUploadingFiles(prev => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [uploadDocument]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "processing":
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case "failed":
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />;
    }
  };

  return (
    <>
      <div className={cn(
        "space-y-6 transition-all duration-300",
        selectedSource ? "mr-[512px]" : ""
      )}>
        {/* Header */}
        <div className="opacity-0 animate-fade-in">
          <h2 className="text-2xl font-semibold">Documents</h2>
          <p className="text-muted-foreground mt-1">Upload PDFs and emails from past investment committees</p>
        </div>

        <Tabs defaultValue="upload" className="opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <TabsList className="mb-4">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            {/* Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-secondary/30"
              )}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.txt,.eml,.msg"
                multiple
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium">Drop files here to upload</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Support for PDF documents, text files, and email files (.eml, .msg)
              </p>
              <Button variant="glow" className="mt-6" onClick={() => fileInputRef.current?.click()}>
                Browse Files
              </Button>
            </div>

            {/* Uploading Files */}
            {uploadingFiles.size > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Uploading...</h3>
                {Array.from(uploadingFiles).map((id) => (
                  <div key={id} className="glass rounded-xl p-4 flex items-center gap-4">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <span className="text-sm">Processing document...</span>
                  </div>
                ))}
              </div>
            )}

            {/* File List */}
            <div className="space-y-3">
              <h3 className="font-semibold">
                Uploaded Documents ({documents.length})
              </h3>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No documents uploaded yet</p>
                  <p className="text-sm">Upload IC memos, emails, and PDFs to get started</p>
                </div>
              ) : (
                documents.map((file, index) => (
                  <div
                    key={file.id}
                    className="glass glass-hover rounded-xl p-4 flex items-center gap-4"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      file.file_type.includes("pdf") ? "bg-destructive/10 text-destructive" : "bg-info/10 text-info"
                    )}>
                      {file.file_type.includes("email") || file.filename.endsWith(".eml") 
                        ? <Mail className="w-5 h-5" /> 
                        : <FileText className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file.filename}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.file_size)}</span>
                        {file.deal_name && (
                          <>
                            <span>•</span>
                            <span>{file.deal_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusIcon(file.status)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => deleteDocument(file.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="search">
            <div className="glass rounded-xl p-6">
              <h3 className="text-sm font-medium mb-2">Semantic Document Search</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Search through all uploaded documents using natural language. Results are ranked by semantic similarity.
              </p>
              <DocumentSearch onSelectSource={setSelectedSource} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Document Viewer Side Pane */}
      <DocumentViewer
        source={selectedSource}
        fullContent={selectedSource?.content}
        onClose={() => setSelectedSource(null)}
      />
    </>
  );
}
