import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, FolderOpen, Calendar, CheckCircle } from "lucide-react";
import CourseFiles from "@/components/courses/CourseFiles";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import SubmitAssignmentDialog from "@/components/assignments/SubmitAssignmentDialog";

const StudentCourseView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchCourseData();
    }
  }, [courseId, userId]);

  const fetchCourseData = async () => {
    if (!userId) return;
    
    try {
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select(`
          *,
          profiles:teacher_id (
            full_name,
            email
          )
        `)
        .eq("id", courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assignments")
        .select("*")
        .eq("course_id", courseId)
        .order("due_date", { ascending: true });

      if (assignmentsError) throw assignmentsError;
      setAssignments(assignmentsData || []);

      // Fetch student's submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from("submissions")
        .select("*")
        .eq("student_id", userId);

      if (submissionsError) throw submissionsError;
      setSubmissions(submissionsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const hasSubmitted = (assignmentId: string) => {
    return submissions.some((s) => s.assignment_id === assignmentId);
  };

  const getSubmission = (assignmentId: string) => {
    return submissions.find((s) => s.assignment_id === assignmentId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold gradient-text">Course Details</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="card-gradient mb-6">
          <CardHeader>
            <div className="flex-1">
              <CardTitle className="text-3xl mb-2">{course.title}</CardTitle>
              <CardDescription className="text-base">
                {course.description || "No description provided"}
              </CardDescription>
              <div className="flex flex-wrap gap-2 mt-3">
                {course.duration && (
                  <Badge variant="outline">
                    Duration: {course.duration}
                  </Badge>
                )}
                <Badge variant="secondary">
                  Instructor: {course.profiles?.full_name || "Unknown"}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="assignments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="assignments">
              <FileText className="h-4 w-4 mr-2" />
              Assignments ({assignments.length})
            </TabsTrigger>
            <TabsTrigger value="files">
              <FolderOpen className="h-4 w-4 mr-2" />
              Files
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assignments">
            {assignments.length === 0 ? (
              <Card className="card-gradient">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No assignments available yet
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {assignments.map((assignment) => {
                  const submitted = hasSubmitted(assignment.id);
                  const submission = getSubmission(assignment.id);
                  const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date() && !submitted;

                  return (
                    <Card key={assignment.id} className="card-gradient">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{assignment.title}</CardTitle>
                              {submitted && (
                                <Badge className="bg-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Submitted
                                </Badge>
                              )}
                              {isOverdue && (
                                <Badge variant="destructive">Overdue</Badge>
                              )}
                            </div>
                            <CardDescription className="mt-2">
                              {assignment.description}
                            </CardDescription>
                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Due: {assignment.due_date 
                                  ? new Date(assignment.due_date).toLocaleDateString()
                                  : "No due date"}
                              </span>
                              {submission?.grade !== null && submission?.grade !== undefined && (
                                <Badge variant="outline">
                                  Grade: {submission.grade}
                                </Badge>
                              )}
                            </div>
                            {submission?.feedback && (
                              <div className="mt-3 p-3 rounded-lg bg-muted/50">
                                <p className="text-sm font-medium">Feedback:</p>
                                <p className="text-sm text-muted-foreground">{submission.feedback}</p>
                              </div>
                            )}
                          </div>
                          <div>
                            {!submitted && userId && (
                              <SubmitAssignmentDialog
                                assignmentId={assignment.id}
                                studentId={userId}
                                onSuccess={fetchCourseData}
                              />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="files">
            {userId && courseId && (
              <CourseFiles
                courseId={courseId}
                userRole="student"
                userId={userId}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StudentCourseView;