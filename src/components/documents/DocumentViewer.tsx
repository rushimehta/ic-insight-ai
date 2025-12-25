import { X, FileText, Calendar, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface DocumentSource {
  document_id: string;
  similarity?: number;
  content_preview?: string;
  content?: string;
  chunk_index?: number;
  metadata?: {
    filename?: string;
    deal_name?: string;
    ic_date?: string;
    chunk_index?: number;
    total_chunks?: number;
  };
}

interface DocumentViewerProps {
  source: DocumentSource | null;
  onClose: () => void;
  fullContent?: string;
}

export function DocumentViewer({ source, onClose, fullContent }: DocumentViewerProps) {
  if (!source) return null;

  const similarity = source.similarity ? Math.round(source.similarity * 100) : null;
  const metadata = source.metadata || {};

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-background border-l border-border shadow-xl z-50 animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">
              {metadata.filename || metadata.deal_name || "Document Source"}
            </h3>
            {similarity && (
              <Badge variant="secondary" className="mt-1">
                {similarity}% match
              </Badge>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Metadata */}
      <div className="p-4 border-b border-border bg-secondary/30">
        <div className="flex flex-wrap gap-4 text-sm">
          {metadata.deal_name && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>{metadata.deal_name}</span>
            </div>
          )}
          {metadata.ic_date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{new Date(metadata.ic_date).toLocaleDateString()}</span>
            </div>
          )}
          {metadata.chunk_index !== undefined && metadata.total_chunks && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="w-4 h-4" />
              <span>Section {metadata.chunk_index + 1} of {metadata.total_chunks}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="p-4">
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Matched Content</h4>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {fullContent || source.content || source.content_preview || "No content available"}
            </div>
          </div>
          
          {source.content_preview && fullContent && source.content_preview !== fullContent && (
            <>
              <h4 className="text-sm font-medium mb-3 mt-6 text-muted-foreground">Preview Snippet</h4>
              <div className="bg-secondary/50 rounded-lg p-4 text-sm text-muted-foreground">
                {source.content_preview}...
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
