import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import CreateAssignmentDialog from "./CreateAssignmentDialog";
import GradeSubmissionDialog from "./GradeSubmissionDialog";

interface TeacherAssignmentsProps {
  userId: string;
}

const TeacherAssignments = ({ userId }: TeacherAssignmentsProps) => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      // Fetch teacher's courses
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("id, title")
        .eq("teacher_id", userId);

      if (coursesError) throw coursesError;
      setCourses(coursesData || []);

      const courseIds = coursesData?.map((c) => c.id) || [];

      if (courseIds.length === 0) {
        setAssignments([]);
        setSubmissions([]);
        setLoading(false);
        return;
      }

      // Fetch assignments
      const { data: assignmentsData, error: assignError } = await supabase
        .from("assignments")
        .select(`
          *,
          courses(title)
        `)
        .in("course_id", courseIds)
        .order("created_at", { ascending: false });

      if (assignError) throw assignError;
      setAssignments(assignmentsData || []);

      // Fetch submissions
      const assignmentIds = assignmentsData?.map((a) => a.id) || [];
      if (assignmentIds.length > 0) {
        const { data: submissionsData, error: subError } = await supabase
          .from("submissions")
          .select(`
            *,
            profiles:student_id(full_name),
            assignments(title)
          `)
          .in("assignment_id", assignmentIds)
          .order("submitted_at", { ascending: false });

        if (subError) throw subError;
        setSubmissions(submissionsData || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-center text-muted-foreground">Loading...</p>;
  }

  if (courses.length === 0) {
    return (
      <Card className="card-gradient">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Create a course first to add assignments.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Manage Assignments</h3>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Assignment
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle>All Assignments</CardTitle>
            <CardDescription>Assignments you've created</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assignments yet.</p>
            ) : (
              assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="p-3 rounded-lg bg-secondary/50 space-y-1"
                >
                  <p className="font-medium text-sm">{assignment.title}</p>
                  <p className="text-xs text-muted-foreground">{assignment.courses?.title}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="card-gradient">
          <CardHeader>
            <CardTitle>Student Submissions</CardTitle>
            <CardDescription>Review and grade submissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No submissions yet.</p>
            ) : (
              submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="p-3 rounded-lg bg-secondary/50 space-y-2"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{submission.assignments?.title}</p>
                    <p className="text-xs text-muted-foreground">
                      By: {submission.profiles?.full_name}
                    </p>
                  </div>
                  {submission.grade === null ? (
                    <GradeSubmissionDialog submission={submission} onSuccess={fetchData} />
                  ) : (
                    <p className="text-xs text-accent font-medium">Graded: {submission.grade}/100</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <CreateAssignmentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        courses={courses}
        onSuccess={() => {
          fetchData();
          setCreateDialogOpen(false);
        }}
      />
    </div>
  );
};

export default TeacherAssignments;
