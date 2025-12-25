import { useState } from "react";
import { Search, FileText, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SearchResult {
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

interface DocumentSearchProps {
  onSelectSource: (source: SearchResult) => void;
}

export function DocumentSearch({ onSelectSource }: DocumentSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      // Generate embedding for query via edge function
      const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke(
        "generate-embedding",
        { body: { text: query } }
      );

      if (embeddingError || !embeddingData?.embedding) {
        throw new Error("Failed to generate embedding");
      }

      // Search using the embedding
      const { data, error } = await supabase.rpc("search_documents", {
        query_embedding: `[${embeddingData.embedding.join(",")}]`,
        match_threshold: 0.3,
        match_count: 10,
      });

      if (error) throw error;

      // Fetch metadata for each result
      const resultsWithMetadata = await Promise.all(
        (data || []).map(async (result: any) => {
          const { data: doc } = await supabase
            .from("documents")
            .select("filename, deal_name, ic_date")
            .eq("id", result.document_id)
            .single();

          return {
            ...result,
            metadata: {
              ...result.metadata,
              filename: doc?.filename,
              deal_name: doc?.deal_name,
              ic_date: doc?.ic_date,
            },
          };
        })
      );

      setResults(resultsWithMetadata);

      if (resultsWithMetadata.length === 0) {
        toast.info("No matching documents found");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search documents semantically..."
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={isSearching || !query.trim()}>
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      {/* Results */}
      <div className="space-y-2">
        {results.map((result) => (
          <button
            key={result.id}
            onClick={() => onSelectSource(result)}
            className="w-full text-left p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors border border-transparent hover:border-primary/20"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm truncate">
                      {result.metadata?.deal_name || result.metadata?.filename || "Document"}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(result.similarity * 100)}% match
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {result.content.slice(0, 200)}...
                  </p>
                  {result.metadata?.ic_date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      IC Date: {new Date(result.metadata.ic_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          </button>
        ))}
      </div>

      {results.length === 0 && !isSearching && query && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Enter a search query to find relevant documents</p>
        </div>
      )}
    </div>
  );
}
