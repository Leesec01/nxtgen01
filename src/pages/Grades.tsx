import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, TrendingUp, Award, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OutletContext {
  userRole: "student" | "teacher";
  userId: string;
}

const Grades = () => {
  const { userRole, userId } = useOutletContext<OutletContext>();

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["grades", userId],
    queryFn: async () => {
      if (userRole === "student") {
        const { data, error } = await supabase
          .from("submissions")
          .select(`
            *,
            assignments(title, course_id, courses(title))
          `)
          .eq("student_id", userId)
          .order("submitted_at", { ascending: false });
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("submissions")
          .select(`
            *,
            assignments(course_id, courses!inner(teacher_id)),
            profiles(full_name)
          `)
          .eq("assignments.courses.teacher_id", userId)
          .order("submitted_at", { ascending: false });
        
        if (error) throw error;
        return data;
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

  const gradedSubmissions = submissions?.filter(s => s.grade !== null) || [];
  const averageGrade = gradedSubmissions.length > 0
    ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
    : 0;

  return (
    <div>
      <h1 className="text-3xl font-bold gradient-text mb-6">
        {userRole === "student" ? "My Grades" : "Performance Overview"}
      </h1>

      {userRole === "student" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="card-gradient">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Average Grade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageGrade.toFixed(1)}%</div>
              <Progress value={averageGrade} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Graded Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{gradedSubmissions.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                out of {submissions?.length || 0} submissions
              </p>
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {submissions?.length ? ((gradedSubmissions.length / submissions.length) * 100).toFixed(0) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>
            {userRole === "student" ? "Recent Grades" : "Recent Submissions"}
          </CardTitle>
          <CardDescription>
            {userRole === "student" 
              ? "Your graded assignments and feedback"
              : "Latest student submissions across all courses"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {submissions?.map((submission: any) => (
              <div
                key={submission.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50"
              >
                <div className="flex-1">
                  <h3 className="font-medium">
                    {userRole === "student" 
                      ? submission.assignments?.title
                      : submission.profiles?.full_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {userRole === "student"
                      ? submission.assignments?.courses?.title
                      : new Date(submission.submitted_at).toLocaleDateString()}
                  </p>
                  {submission.feedback && (
                    <p className="text-sm mt-2 text-muted-foreground italic">
                      "{submission.feedback}"
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {submission.grade !== null ? (
                    <Badge variant={submission.grade >= 70 ? "default" : "secondary"}>
                      {submission.grade}%
                    </Badge>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </div>
              </div>
            ))}
            {submissions?.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No submissions yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Grades;
