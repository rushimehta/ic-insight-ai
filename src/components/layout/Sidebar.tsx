import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  HelpCircle,
  History,
  ChevronLeft,
  Target,
  LogOut,
  User,
  FileEdit,
  ClipboardList,
  Shield,
  BarChart3,
  Kanban,
  FolderOpen,
  Settings,
  Briefcase,
  Sun,
  Moon,
  Monitor,
  Upload,
  Database,
  Library
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useTheme } from "@/hooks/useTheme";
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
  section?: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Deal Command Center", id: "dashboard", section: "core" },
  { icon: Briefcase, label: "Deal CRM", id: "crm", section: "deals" },
  { icon: Kanban, label: "Deal Pipeline", id: "pipeline", section: "deals" },
  { icon: BarChart3, label: "Analytics", id: "analytics", section: "deals" },
  { icon: Library, label: "IC Archive", id: "repository", section: "ic" },
  { icon: Upload, label: "Upload IC Decks", id: "documents", section: "ic" },
  { icon: FileEdit, label: "IC Memo Builder", id: "generator", section: "ic" },
  { icon: ClipboardList, label: "IC Meeting Tracker", id: "chairman", section: "ic" },
  { icon: History, label: "IC History", id: "history", section: "ic" },
  { icon: MessageSquare, label: "Deal Advisor AI", id: "chat", section: "ai" },
  { icon: HelpCircle, label: "IC Question Prep", id: "questions", section: "ai" },
  { icon: Database, label: "Data Connectors", id: "connectors", section: "integrations" },
  { icon: Shield, label: "Admin", id: "admin", requiresChairman: true, section: "admin" },
];

const sectionLabels: Record<string, string> = {
  core: "",
  deals: "DEAL MANAGEMENT",
  ic: "INVESTMENT COMMITTEE",
  ai: "AI & INSIGHTS",
  integrations: "INTEGRATIONS",
  admin: "ADMINISTRATION",
};

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { user, signOut } = useAuth();
  const { roles, isChairmanOrAdmin } = useUserPermissions();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
  };

  const userEmail = user?.email || "";
  const userName = user?.user_metadata?.full_name || userEmail.split("@")[0];
  const displayRole = roles[0]?.replace(/_/g, " ") || "Team Member";

  const visibleNavItems = navItems.filter(item =>
    !item.requiresChairman || isChairmanOrAdmin
  );

  // Group items by section
  const groupedItems: { section: string; items: NavItem[] }[] = [];
  let currentSection = "";
  visibleNavItems.forEach(item => {
    const section = item.section || "";
    if (section !== currentSection) {
      groupedItems.push({ section, items: [item] });
      currentSection = section;
    } else {
      groupedItems[groupedItems.length - 1].items.push(item);
    }
  });

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
          <Target className="w-5 h-5 text-primary" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-semibold text-foreground">Deal IC Advisor</h1>
            <p className="text-xs text-muted-foreground">PE Investment Intelligence</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {groupedItems.map((group, gi) => (
          <div key={gi}>
            {!collapsed && sectionLabels[group.section] && (
              <div className="text-[10px] font-semibold text-muted-foreground/60 tracking-wider px-3 pt-4 pb-1.5">
                {sectionLabels[group.section]}
              </div>
            )}
            {collapsed && gi > 0 && sectionLabels[group.section] && (
              <div className="border-t border-sidebar-border my-2" />
            )}
            {group.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === item.id
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="w-4.5 h-4.5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>
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
                      {role.replace(/_/g, " ")}
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
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Theme</div>
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="w-4 h-4 mr-2" />
              Light
              {theme === "light" && <span className="ml-auto text-primary">&#10003;</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="w-4 h-4 mr-2" />
              Dark
              {theme === "dark" && <span className="ml-auto text-primary">&#10003;</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="w-4 h-4 mr-2" />
              System
              {theme === "system" && <span className="ml-auto text-primary">&#10003;</span>}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
