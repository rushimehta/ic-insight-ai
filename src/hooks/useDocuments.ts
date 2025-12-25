import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Document {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  status: string;
  deal_name?: string | null;
  ic_date?: string | null;
  created_at: string;
}

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } else {
      setDocuments(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const uploadDocument = async (file: File, metadata?: { dealName?: string; sector?: string }) => {
    if (!user) {
      toast.error("Please sign in to upload documents");
      return null;
    }
    
    // Create document record
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        filename: file.name,
        file_type: file.type || "application/pdf",
        file_size: file.size,
        deal_name: metadata?.dealName,
        status: "pending",
        metadata: { sector: metadata?.sector },
        user_id: user.id,
      })
      .select()
      .single();

    if (docError) {
      console.error("Error creating document:", docError);
      toast.error("Failed to create document record");
      return null;
    }

    // Read file content (for text-based processing)
    const content = await file.text();

    // Process the document via edge function
    try {
      const { error } = await supabase.functions.invoke("process-document", {
        body: {
          documentId: doc.id,
          content,
          metadata: {
            filename: file.name,
            dealName: metadata?.dealName,
            sector: metadata?.sector,
          },
        },
      });

      if (error) throw error;

      toast.success("Document processed successfully!");
      fetchDocuments();
      return doc;
    } catch (error) {
      console.error("Error processing document:", error);
      toast.error("Failed to process document");
      
      // Update status to failed
      await supabase
        .from("documents")
        .update({ status: "failed" })
        .eq("id", doc.id);
      
      return null;
    }
  };

  const deleteDocument = async (id: string) => {
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    } else {
      toast.success("Document deleted");
      setDocuments(prev => prev.filter(d => d.id !== id));
    }
  };

  return {
    documents,
    isLoading,
    uploadDocument,
    deleteDocument,
    refetch: fetchDocuments,
  };
}
