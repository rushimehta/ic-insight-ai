import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Source {
  document_id: string;
  similarity?: number;
  content_preview?: string;
}

interface SourceBadgeProps {
  source: Source;
  index: number;
  onClick: () => void;
}

export function SourceBadge({ source, index, onClick }: SourceBadgeProps) {
  const similarity = source.similarity ? Math.round(source.similarity * 100) : null;

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 transition-all text-xs group"
    >
      <FileText className="w-3 h-3 text-primary" />
      <span className="text-primary font-medium">Source {index + 1}</span>
      {similarity && (
        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
          {similarity}%
        </Badge>
      )}
    </button>
  );
}
