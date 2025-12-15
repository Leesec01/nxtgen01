import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, FileText, Trash2, Edit, FolderOpen } from "lucide-react";
import CreateAssignmentDialog from "@/components/assignments/CreateAssignmentDialog";
import CourseFiles from "@/components/courses/CourseFiles";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createAssignmentOpen, setCreateAssignmentOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch enrolled students
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from("enrollments")
        .select(`
          id,
          enrolled_at,
          profiles:student_id (
            id,
            full_name,
            email
          )
        `)
        .eq("course_id", courseId);

      if (enrollmentsError) throw enrollmentsError;
      setStudents(enrollmentsData || []);

      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assignments")
        .select(`
          *,
          submissions(count)
        `)
        .eq("course_id", courseId)
        .order("created_at", { ascending: false });

      if (assignmentsError) throw assignmentsError;
      setAssignments(assignmentsData || []);
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

  const handleDeleteCourse = async () => {
    try {
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from("assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment deleted successfully",
      });
      fetchCourseData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold gradient-text">Course Management</h1>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Course
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="card-gradient mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{course.title}</CardTitle>
                <CardDescription className="text-base">
                  {course.description || "No description provided"}
                </CardDescription>
                {course.duration && (
                  <Badge variant="outline" className="mt-3">
                    Duration: {course.duration}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="students" className="space-y-6">
          <TabsList>
            <TabsTrigger value="students">
              <Users className="h-4 w-4 mr-2" />
              Students ({students.length})
            </TabsTrigger>
            <TabsTrigger value="assignments">
              <FileText className="h-4 w-4 mr-2" />
              Assignments ({assignments.length})
            </TabsTrigger>
            <TabsTrigger value="files">
              <FolderOpen className="h-4 w-4 mr-2" />
              Files
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle>Enrolled Students</CardTitle>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No students enrolled yet
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Enrolled Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((enrollment) => (
                        <TableRow key={enrollment.id}>
                          <TableCell className="font-medium">
                            {enrollment.profiles?.full_name || "Unknown"}
                          </TableCell>
                          <TableCell>{enrollment.profiles?.email || "N/A"}</TableCell>
                          <TableCell>
                            {new Date(enrollment.enrolled_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setCreateAssignmentOpen(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </div>

            {assignments.length === 0 ? (
              <Card className="card-gradient">
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    No assignments created yet
                  </p>
                  <Button onClick={() => setCreateAssignmentOpen(true)}>
                    Create First Assignment
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {assignments.map((assignment) => (
                  <Card key={assignment.id} className="card-gradient">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle>{assignment.title}</CardTitle>
                          <CardDescription className="mt-2">
                            {assignment.description}
                          </CardDescription>
                          <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                            <span>
                              Due: {assignment.due_date 
                                ? new Date(assignment.due_date).toLocaleDateString()
                                : "No due date"}
                            </span>
                            <span>
                              Submissions: {assignment.submissions?.[0]?.count || 0}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteAssignment(assignment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="files">
            {userId && courseId && (
              <CourseFiles
                courseId={courseId}
                userRole="teacher"
                userId={userId}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>

      <CreateAssignmentDialog
        open={createAssignmentOpen}
        onOpenChange={setCreateAssignmentOpen}
        courses={course ? [course] : []}
        onSuccess={() => {
          setCreateAssignmentOpen(false);
          fetchCourseData();
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this course? This action cannot be undone.
              All assignments and enrollments will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCourse} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CourseDetail;
