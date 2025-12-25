import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { RoleDashboard } from "@/components/dashboard/RoleDashboard";
import { DocumentUpload } from "@/components/documents/DocumentUpload";
import { AIChat } from "@/components/chat/AIChat";
import { QuestionPrep } from "@/components/questions/QuestionPrep";
import { ICHistory } from "@/components/history/ICHistory";
import { ICDocumentGenerator } from "@/components/generator/ICDocumentGenerator";
import { ChairmanNotes } from "@/components/chairman/ChairmanNotes";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { cn } from "@/lib/utils";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <RoleDashboard />;
      case "documents":
        return <DocumentUpload />;
      case "generator":
        return <ICDocumentGenerator />;
      case "chat":
        return <AIChat />;
      case "questions":
        return <QuestionPrep />;
      case "history":
        return <ICHistory />;
      case "chairman":
        return <ChairmanNotes />;
      case "admin":
        return <AdminPanel />;
      default:
        return <RoleDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className={cn(
        "transition-all duration-300 p-6 lg:p-8",
        "ml-16 lg:ml-64"
      )}>
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
      
      {/* Background Glow Effect */}
      <div 
        className="fixed top-0 right-0 w-[500px] h-[500px] pointer-events-none opacity-30"
        style={{ background: "var(--gradient-glow)" }}
      />
    </div>
  );
};

export default Index;
