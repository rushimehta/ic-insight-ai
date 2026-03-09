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
  "/calendar": "calendar",
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
        "transition-all duration-300 p-5 lg:p-6",
        "ml-16 lg:ml-60"
      )}>
        <div className="max-w-[1440px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Index;
