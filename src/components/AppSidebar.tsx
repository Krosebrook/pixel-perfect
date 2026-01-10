import { useLocation } from "react-router-dom";
import { NavLink } from "./NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Zap,
  Library,
  Settings,
  Shield,
  Sparkles,
  Trophy,
  Clock,
  Users,
  Activity,
  FileText,
  BarChart,
  Key,
  TrendingUp,
  Layers,
  TestTube2,
  ChevronDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const promptsGroup = [
  { title: "Library", url: "/prompts", icon: Library },
  { title: "Compare", url: "/models/compare", icon: Zap },
  { title: "Batch", url: "/models/batch", icon: Layers },
  { title: "Templates", url: "/templates", icon: Sparkles },
];

const analyticsGroup = [
  { title: "Analytics", url: "/analytics", icon: BarChart },
  { title: "API Usage", url: "/api-usage", icon: Activity },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
];

const apiGroup = [
  { title: "API Keys", url: "/api-keys", icon: Key },
  { title: "API Docs", url: "/api-docs", icon: FileText },
];

const teamGroup = [
  { title: "Teams", url: "/teams", icon: Users },
  { title: "Scheduled", url: "/scheduled-tests", icon: Clock },
];

const adminGroup = [
  { title: "Security", url: "/security", icon: Shield },
  { title: "Deployments", url: "/deployment-metrics", icon: TrendingUp },
  { title: "Coverage", url: "/test-coverage", icon: TestTube2 },
  { title: "Admin", url: "/admin", icon: Shield },
];

interface NavGroupProps {
  label: string;
  items: { title: string; url: string; icon: React.ComponentType<{ className?: string }> }[];
  defaultOpen?: boolean;
}

function NavGroup({ label, items, defaultOpen = false }: NavGroupProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isGroupActive = items.some((item) => location.pathname === item.url);

  if (collapsed) {
    return (
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild tooltip={item.title}>
              <NavLink
                to={item.url}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
              >
                <item.icon className="h-4 w-4 shrink-0" />
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    );
  }

  return (
    <Collapsible defaultOpen={defaultOpen || isGroupActive} className="group/collapsible">
      <SidebarGroup>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent rounded-md px-2 py-1 flex items-center justify-between">
            {label}
            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

export function AppSidebar() {
  const { user } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const { data: isAdmin } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();
      return !!data;
    },
    enabled: !!user,
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <NavLink to="/" className="flex items-center gap-2 font-bold text-lg">
          <Zap className="h-6 w-6 text-primary shrink-0" />
          {!collapsed && <span>UPGE</span>}
        </NavLink>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {/* Home */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Home">
              <NavLink
                to="/"
                end
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
              >
                <Zap className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Home</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="mt-4 space-y-2">
          <NavGroup label="Prompts" items={promptsGroup} defaultOpen />
          <NavGroup label="Analytics" items={analyticsGroup} />
          <NavGroup label="API" items={apiGroup} />
          <NavGroup label="Team" items={teamGroup} />
          {isAdmin && <NavGroup label="Admin" items={adminGroup} />}
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <NavLink
                to="/settings"
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
                  location.pathname === "/settings" && "bg-sidebar-accent text-sidebar-primary font-medium"
                )}
              >
                <Settings className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Settings</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
