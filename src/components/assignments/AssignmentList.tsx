import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Calendar, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import SubmitAssignmentDialog from "./SubmitAssignmentDialog";

interface AssignmentListProps {
  userId: string;
  userRole: string;
}

const AssignmentList = ({ userId, userRole }: AssignmentListProps) => {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();

    // Subscribe to submission changes
    const channel = supabase
      .channel('submissions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: `student_id=eq.${userId}`,
        },
        () => {
          fetchAssignments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchAssignments = async () => {
    try {
      // Get enrolled courses
      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("student_id", userId);

      if (enrollError) throw enrollError;

      const courseIds = enrollments.map((e) => e.course_id);

      if (courseIds.length === 0) {
        setAssignments([]);
        setLoading(false);
        return;
      }

      // Get assignments for enrolled courses
      const { data: assignmentsData, error: assignError } = await supabase
        .from("assignments")
        .select(`
          *,
          courses(title)
        `)
        .in("course_id", courseIds)
        .order("due_date", { ascending: true, nullsFirst: false });

      if (assignError) throw assignError;

      // Get submissions
      const { data: submissionsData, error: subError } = await supabase
        .from("submissions")
        .select("*")
        .eq("student_id", userId);

      if (subError) throw subError;

      const submissionsMap = new Map(
        submissionsData.map((sub) => [sub.assignment_id, sub])
      );

      setAssignments(assignmentsData || []);
      setSubmissions(submissionsMap);
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

  const getStatus = (assignment: any) => {
    const submission = submissions.get(assignment.id);
    
    if (submission) {
      if (submission.grade !== null) {
        return { label: "Graded", color: "bg-accent text-accent-foreground", icon: CheckCircle2 };
      }
      return { label: "Submitted", color: "bg-primary text-primary-foreground", icon: CheckCircle2 };
    }

    if (assignment.due_date) {
      const dueDate = new Date(assignment.due_date);
      const now = new Date();
      if (dueDate < now) {
        return { label: "Overdue", color: "bg-destructive text-destructive-foreground", icon: Clock };
      }
    }

    return { label: "Pending", color: "bg-secondary text-secondary-foreground", icon: FileText };
  };

  if (loading) {
    return <p className="text-center text-muted-foreground">Loading assignments...</p>;
  }

  if (assignments.length === 0) {
    return (
      <Card className="card-gradient">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No assignments available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => {
        const status = getStatus(assignment);
        const submission = submissions.get(assignment.id);
        const StatusIcon = status.icon;

        return (
          <Card key={assignment.id} className="card-gradient">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {assignment.title}
                    <Badge className={status.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {assignment.courses?.title}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignment.description && (
                <p className="text-sm text-muted-foreground">{assignment.description}</p>
              )}
              
              {assignment.due_date && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Due: {format(new Date(assignment.due_date), "PPP")}</span>
                </div>
              )}

              {submission ? (
                <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium">Your Submission</p>
                  {submission.content && (
                    <p className="text-sm text-muted-foreground">{submission.content}</p>
                  )}
                  {submission.grade !== null && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-sm font-medium">
                        Grade: <span className="text-accent">{submission.grade}/100</span>
                      </p>
                      {submission.feedback && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Feedback: {submission.feedback}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <SubmitAssignmentDialog
                  assignmentId={assignment.id}
                  studentId={userId}
                  onSuccess={fetchAssignments}
                />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AssignmentList;
