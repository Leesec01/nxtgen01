import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import TeacherDashboard from "@/components/dashboard/TeacherDashboard";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"student" | "teacher" | null>(null);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          // Clear any stale session data
          await supabase.auth.signOut();
          navigate("/auth");
          return;
        }

        setUserId(session.user.id);

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (error) {
          console.error("Profile fetch error:", error);
          await supabase.auth.signOut();
          navigate("/auth");
          return;
        }

        if (!profile) {
          // Profile doesn't exist - user account may have been deleted
          await supabase.auth.signOut();
          navigate("/auth");
          return;
        }

        setUserRole(profile.role);
      } catch (error: any) {
        console.error("Dashboard error:", error);
        await supabase.auth.signOut();
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [navigate, toast]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-text">Nxtgen LMS</h1>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {userRole === "student" && <StudentDashboard userId={userId} />}
        {userRole === "teacher" && <TeacherDashboard userId={userId} />}
      </main>
    </div>
  );
};

export default Dashboard;
