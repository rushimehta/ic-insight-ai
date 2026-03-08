import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

const TAB_FROM_PATH: Record<string, string> = {
  "/": "dashboard",
  "/dashboard": "dashboard",
  "/crm": "crm",
  "/pipeline": "pipeline",
  "/analytics": "analytics",
  "/documents": "documents",
  "/repository": "repository",
  "/generator": "generator",
  "/chat": "chat",
  "/questions": "questions",
  "/history": "history",
  "/chairman": "chairman",
  "/connectors": "connectors",
  "/admin": "admin",
};

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = TAB_FROM_PATH[location.pathname] || "dashboard";

  const handleTabChange = (tab: string) => {
    navigate(tab === "dashboard" ? "/" : `/${tab}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <main className={cn(
        "transition-all duration-300 p-6 lg:p-8",
        "ml-16 lg:ml-64"
      )}>
        <div className="max-w-7xl mx-auto">
          <Outlet />
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
