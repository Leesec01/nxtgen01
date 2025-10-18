import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AttendanceTracker } from '@/components/attendance/AttendanceTracker';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface OutletContext {
  userRole: 'student' | 'teacher';
  userId: string;
}

interface Course {
  id: string;
  title: string;
}

export default function Attendance() {
  const { userRole, userId } = useOutletContext<OutletContext>();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, [userId, userRole]);

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      if (userRole === 'teacher') {
        const { data, error } = await supabase
          .from('courses')
          .select('id, title')
          .eq('teacher_id', userId);

        if (error) throw error;
        setCourses(data || []);
        if (data && data.length > 0) {
          setSelectedCourse(data[0].id);
        }
      } else {
        const { data, error } = await supabase
          .from('enrollments')
          .select('course:courses(id, title)')
          .eq('student_id', userId);

        if (error) throw error;
        const coursesData = data?.map((e: any) => e.course).filter(Boolean) || [];
        setCourses(coursesData);
        if (coursesData.length > 0) {
          setSelectedCourse(coursesData[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Attendance Management</h1>
        <p className="text-muted-foreground">
          {userRole === 'teacher'
            ? 'Track and manage student attendance'
            : 'View your attendance records'}
        </p>
      </div>

      {courses.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            {userRole === 'teacher'
              ? 'No courses found. Create a course to start tracking attendance.'
              : 'No enrolled courses found.'}
          </p>
        </Card>
      ) : (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Select Course</label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCourse && (
            <AttendanceTracker
              courseId={selectedCourse}
              isTeacher={userRole === 'teacher'}
            />
          )}
        </>
      )}
    </div>
  );
}