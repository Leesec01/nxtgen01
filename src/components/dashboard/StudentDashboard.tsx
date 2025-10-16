import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, GraduationCap, FileText, CheckCircle2 } from "lucide-react";
import CourseCard from "@/components/courses/CourseCard";
import AssignmentList from "@/components/assignments/AssignmentList";

interface StudentDashboardProps {
  userId: string;
}

const StudentDashboard = ({ userId }: StudentDashboardProps) => {
  const { toast } = useToast();
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Subscribe to enrollment changes
    const channel = supabase
      .channel('enrollments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'enrollments',
          filter: `student_id=eq.${userId}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchData = async () => {
    try {
      // Fetch all courses
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select(`
          *,
          profiles:teacher_id (full_name)
        `)
        .order("created_at", { ascending: false });

      if (coursesError) throw coursesError;

      // Fetch enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("student_id", userId);

      if (enrollmentsError) throw enrollmentsError;

      const enrolledIds = new Set(enrollmentsData.map((e) => e.course_id));
      setEnrollments(enrolledIds);

      setAllCourses(coursesData || []);
      setEnrolledCourses(
        (coursesData || []).filter((course) => enrolledIds.has(course.id))
      );
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

  const handleEnroll = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from("enrollments")
        .insert({ course_id: courseId, student_id: userId });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Enrolled in course successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUnenroll = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from("enrollments")
        .delete()
        .eq("course_id", courseId)
        .eq("student_id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Unenrolled from course successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const stats = [
    {
      title: "Enrolled Courses",
      value: enrolledCourses.length,
      icon: BookOpen,
      color: "text-primary",
    },
    {
      title: "Available Courses",
      value: allCourses.length,
      icon: GraduationCap,
      color: "text-accent",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Student Dashboard</h2>
        <p className="text-muted-foreground">Manage your courses and assignments</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {stats.map((stat) => (
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

      <Tabs defaultValue="all-courses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all-courses">All Courses</TabsTrigger>
          <TabsTrigger value="my-courses">My Courses</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="all-courses" className="space-y-4">
          {loading ? (
            <p className="text-center text-muted-foreground">Loading courses...</p>
          ) : allCourses.length === 0 ? (
            <Card className="card-gradient">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No courses available yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isEnrolled={enrollments.has(course.id)}
                  onEnroll={handleEnroll}
                  onUnenroll={handleUnenroll}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-courses" className="space-y-4">
          {enrolledCourses.length === 0 ? (
            <Card className="card-gradient">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">You haven't enrolled in any courses yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {enrolledCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isEnrolled={true}
                  onUnenroll={handleUnenroll}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <AssignmentList userId={userId} userRole="student" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentDashboard;
