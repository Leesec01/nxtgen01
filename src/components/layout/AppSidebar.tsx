import { Home, BookOpen, FileText, BarChart3, User, LogOut, Bot, Calendar } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";

interface AppSidebarProps {
  userRole: "student" | "teacher";
}

export function AppSidebar({ userRole }: AppSidebarProps) {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const { toast } = useToast();
  const collapsed = state === "collapsed";

  const menuItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Courses", url: "/courses", icon: BookOpen },
    { title: "Assignments", url: "/assignments", icon: FileText },
    { title: userRole === "student" ? "Grades" : "Performance", url: "/grades", icon: BarChart3 },
    { title: "AI Assistant", url: "/ai-chat", icon: Bot },
    { title: "Attendance", url: "/attendance", icon: Calendar },
    { title: "Profile", url: "/profile", icon: User },
  ];

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: "global" });

      if (error) {
        const msg = String((error as any)?.message || "").toLowerCase();
        const status = (error as any)?.status;
        if (status === 403 || msg.includes("session")) {
          // Session missing on server — clear locally and proceed
          await supabase.auth.signOut({ scope: "local" });
        } else {
          throw error;
        }
      }

      toast({ title: "Signed out successfully" });
      navigate("/auth", { replace: true });
    } catch (error: any) {
      // Last resort: ensure local tokens are cleared and redirect
      try { await supabase.auth.signOut({ scope: "local" }); } catch {}
      navigate("/auth", { replace: true });
      toast({ title: "Signed out", description: "Your local session has been cleared." });
    }
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
      : "hover:bg-accent/50 text-muted-foreground hover:text-foreground";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <div className="p-4 border-b border-border">
        {!collapsed && (
          <h2 className="text-lg font-bold gradient-text">Nxtgen LMS</h2>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span className="ml-2">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  {!collapsed && <span className="ml-2">Sign Out</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
