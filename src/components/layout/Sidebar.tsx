import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  HelpCircle, 
  History,
  ChevronLeft,
  Sparkles,
  LogOut,
  User,
  FileEdit,
  ClipboardList,
  Shield,
  BarChart3,
  Kanban,
  FolderOpen,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserSettingsDialog } from "@/components/profile/UserSettingsDialog";

interface NavItem {
  icon: React.ElementType;
  label: string;
  id: string;
  requiresChairman?: boolean;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: Kanban, label: "Deal Pipeline", id: "pipeline" },
  { icon: BarChart3, label: "Analytics", id: "analytics" },
  { icon: FileText, label: "Documents", id: "documents" },
  { icon: FolderOpen, label: "Repository", id: "repository" },
  { icon: FileEdit, label: "IC Generator", id: "generator" },
  { icon: MessageSquare, label: "AI Chat", id: "chat" },
  { icon: HelpCircle, label: "Question Prep", id: "questions" },
  { icon: History, label: "IC History", id: "history" },
  { icon: ClipboardList, label: "Chairman Notes", id: "chairman", requiresChairman: true },
  { icon: Shield, label: "Admin", id: "admin", requiresChairman: true },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { user, signOut } = useAuth();
  const { roles, isChairmanOrAdmin } = useUserPermissions();

  const handleSignOut = async () => {
    await signOut();
  };

  const userEmail = user?.email || "";
  const userName = user?.user_metadata?.full_name || userEmail.split("@")[0];
  const displayRole = roles[0]?.replace("_", " ") || "Team Member";

  const visibleNavItems = navItems.filter(item => 
    !item.requiresChairman || isChairmanOrAdmin
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center glow">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-semibold text-foreground">IC Prep AI</h1>
            <p className="text-xs text-muted-foreground">Investment Intelligence</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === item.id
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom - User Menu */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200",
                collapsed && "justify-center"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              {!collapsed && (
                <div className="flex-1 text-left overflow-hidden">
                  <p className="font-medium text-foreground truncate">{userName}</p>
                  <p className="text-xs text-muted-foreground truncate capitalize">{displayRole}</p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
              {roles.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {roles.map(role => (
                    <Badge key={role} variant="secondary" className="text-[10px] capitalize">
                      {role.replace("_", " ")}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center"
        >
          <ChevronLeft className={cn("w-5 h-5 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      <UserSettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </aside>
  );
}
