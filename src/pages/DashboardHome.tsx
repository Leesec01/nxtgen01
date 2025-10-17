import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, Award, Users, Loader2 } from "lucide-react";

interface OutletContext {
  userRole: "student" | "teacher";
  userId: string;
}

const DashboardHome = () => {
  const { userRole, userId } = useOutletContext<OutletContext>();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", userId, userRole],
    queryFn: async () => {
      if (userRole === "student") {
        const [enrollments, submissions, grades] = await Promise.all([
          supabase.from("enrollments").select("*", { count: "exact" }).eq("student_id", userId),
          supabase.from("submissions").select("*", { count: "exact" }).eq("student_id", userId),
          supabase.from("submissions").select("grade").eq("student_id", userId).not("grade", "is", null),
        ]);

        const avgGrade = grades.data?.length
          ? grades.data.reduce((sum, s) => sum + (s.grade || 0), 0) / grades.data.length
          : 0;

        return {
          courses: enrollments.count || 0,
          assignments: submissions.count || 0,
          avgGrade: avgGrade.toFixed(1),
          graded: grades.data?.length || 0,
        };
      } else {
        const [courses, assignments, submissions, students] = await Promise.all([
          supabase.from("courses").select("*", { count: "exact" }).eq("teacher_id", userId),
          supabase.from("assignments").select("*, courses!inner(teacher_id)", { count: "exact" }).eq("courses.teacher_id", userId),
          supabase.from("submissions").select("*, assignments!inner(*, courses!inner(teacher_id))", { count: "exact" }).eq("assignments.courses.teacher_id", userId),
          supabase.from("enrollments").select("*, courses!inner(teacher_id)", { count: "exact" }).eq("courses.teacher_id", userId),
        ]);

        return {
          courses: courses.count || 0,
          assignments: assignments.count || 0,
          submissions: submissions.count || 0,
          students: students.count || 0,
        };
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold gradient-text mb-2">Dashboard</h1>
      <p className="text-muted-foreground mb-6">
        Welcome back! Here's your overview.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {userRole === "student" ? (
          <>
            <Card className="card-gradient">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Enrolled Courses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.courses}</div>
              </CardContent>
            </Card>

            <Card className="card-gradient">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Submissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.assignments}</div>
              </CardContent>
            </Card>

            <Card className="card-gradient">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  Average Grade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.avgGrade}%</div>
              </CardContent>
            </Card>

            <Card className="card-gradient">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Graded
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.graded}</div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="card-gradient">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Total Courses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.courses}</div>
              </CardContent>
            </Card>

            <Card className="card-gradient">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.assignments}</div>
              </CardContent>
            </Card>

            <Card className="card-gradient">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Total Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.students}</div>
              </CardContent>
            </Card>

            <Card className="card-gradient">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Pending Submissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.submissions}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;
