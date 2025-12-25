import { useState } from "react";
import { FileDown, FileText, File, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface DocumentExportProps {
  documentContent: string;
  documentTitle: string;
  className?: string;
}

export function DocumentExport({ documentContent, documentTitle, className }: DocumentExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<string | null>(null);

  const formatContent = (content: string): string => {
    // Clean up markdown for plain text export
    return content
      .replace(/#{1,6}\s/g, "") // Remove headers
      .replace(/\*\*/g, "") // Remove bold
      .replace(/\*/g, "") // Remove italic
      .replace(/`/g, "") // Remove code
      .replace(/---/g, "─".repeat(50)); // Replace horizontal rules
  };

  const generatePlainText = (): string => {
    const header = `
═══════════════════════════════════════════════════════════════
                    INVESTMENT COMMITTEE MEMORANDUM
═══════════════════════════════════════════════════════════════

Deal: ${documentTitle}
Generated: ${new Date().toLocaleDateString("en-US", { 
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    })}

───────────────────────────────────────────────────────────────

`;
    return header + formatContent(documentContent);
  };

  const generateHTML = (): string => {
    // Convert markdown to HTML
    const htmlContent = documentContent
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${documentTitle} - IC Memorandum</title>
  <style>
    body {
      font-family: 'Georgia', serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 40px;
      line-height: 1.6;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
      margin-bottom: 40px;
    }
    .header h1 {
      font-size: 24px;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .meta {
      font-size: 14px;
      color: #666;
      margin-top: 10px;
    }
    h2 {
      font-size: 18px;
      color: #1a1a1a;
      margin-top: 30px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    h3 {
      font-size: 16px;
      color: #333;
      margin-top: 20px;
    }
    p, li {
      font-size: 14px;
    }
    @media print {
      body {
        margin: 0;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Investment Committee Memorandum</h1>
    <div class="meta">
      <strong>${documentTitle}</strong><br>
      Generated: ${new Date().toLocaleDateString()}
    </div>
  </div>
  <div class="content">
    ${htmlContent}
  </div>
</body>
</html>
    `;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: "txt" | "html" | "md") => {
    setIsExporting(true);
    setExportFormat(format);

    try {
      const sanitizedTitle = documentTitle.replace(/[^a-zA-Z0-9]/g, "_");
      const timestamp = new Date().toISOString().split("T")[0];
      
      switch (format) {
        case "txt":
          downloadFile(
            generatePlainText(),
            `${sanitizedTitle}_IC_Memo_${timestamp}.txt`,
            "text/plain"
          );
          break;
        case "html":
          downloadFile(
            generateHTML(),
            `${sanitizedTitle}_IC_Memo_${timestamp}.html`,
            "text/html"
          );
          break;
        case "md":
          const mdContent = `# ${documentTitle}\n\n*Generated: ${new Date().toLocaleDateString()}*\n\n---\n\n${documentContent}`;
          downloadFile(
            mdContent,
            `${sanitizedTitle}_IC_Memo_${timestamp}.md`,
            "text/markdown"
          );
          break;
      }

      toast.success(`Document exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export document");
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("txt")} className="cursor-pointer">
          <FileText className="w-4 h-4 mr-2" />
          Plain Text (.txt)
          {exportFormat === "txt" && <Check className="w-4 h-4 ml-auto text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("html")} className="cursor-pointer">
          <File className="w-4 h-4 mr-2" />
          HTML Document (.html)
          {exportFormat === "html" && <Check className="w-4 h-4 ml-auto text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("md")} className="cursor-pointer">
          <FileText className="w-4 h-4 mr-2" />
          Markdown (.md)
          {exportFormat === "md" && <Check className="w-4 h-4 ml-auto text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
