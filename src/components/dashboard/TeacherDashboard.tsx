import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Users, FileText, Plus } from "lucide-react";
import CreateCourseDialog from "@/components/courses/CreateCourseDialog";
import TeacherCourseCard from "@/components/courses/TeacherCourseCard";
import TeacherAssignments from "@/components/assignments/TeacherAssignments";

interface TeacherDashboardProps {
  userId: string;
}

const TeacherDashboard = ({ userId }: TeacherDashboardProps) => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [stats, setStats] = useState({ courses: 0, students: 0, assignments: 0 });
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
        .select(`
          *,
          enrollments(count),
          assignments(count)
        `)
        .eq("teacher_id", userId)
        .order("created_at", { ascending: false });

      if (coursesError) throw coursesError;

      setCourses(coursesData || []);

      // Calculate stats
      const totalStudents = coursesData?.reduce(
        (sum, course) => sum + (course.enrollments?.[0]?.count || 0),
        0
      ) || 0;

      const totalAssignments = coursesData?.reduce(
        (sum, course) => sum + (course.assignments?.[0]?.count || 0),
        0
      ) || 0;

      setStats({
        courses: coursesData?.length || 0,
        students: totalStudents,
        assignments: totalAssignments,
      });
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

  const handleCourseCreated = () => {
    fetchData();
    setCreateDialogOpen(false);
  };

  const statsCards = [
    { title: "My Courses", value: stats.courses, icon: BookOpen, color: "text-primary" },
    { title: "Total Students", value: stats.students, icon: Users, color: "text-accent" },
    { title: "Assignments", value: stats.assignments, icon: FileText, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Teacher Dashboard</h2>
          <p className="text-muted-foreground">Manage your courses and students</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Course
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="card-gradient">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          {loading ? (
            <p className="text-center text-muted-foreground">Loading courses...</p>
          ) : courses.length === 0 ? (
            <Card className="card-gradient">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground mb-4">You haven't created any courses yet.</p>
                <Button onClick={() => setCreateDialogOpen(true)}>Create Your First Course</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <TeacherCourseCard key={course.id} course={course} onUpdate={fetchData} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <TeacherAssignments userId={userId} />
        </TabsContent>
      </Tabs>

      <CreateCourseDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        teacherId={userId}
        onSuccess={handleCourseCreated}
      />
    </div>
  );
};

export default TeacherDashboard;
