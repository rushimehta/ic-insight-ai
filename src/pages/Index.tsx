import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { DocumentUpload } from "@/components/documents/DocumentUpload";
import { AIChat } from "@/components/chat/AIChat";
import { QuestionPrep } from "@/components/questions/QuestionPrep";
import { ICHistory } from "@/components/history/ICHistory";
import { cn } from "@/lib/utils";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "documents":
        return <DocumentUpload />;
      case "chat":
        return <AIChat />;
      case "questions":
        return <QuestionPrep />;
      case "history":
        return <ICHistory />;
      default:
        return <Dashboard />;
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
