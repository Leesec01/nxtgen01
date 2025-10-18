import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Check, X, Clock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';

interface AttendanceTrackerProps {
  courseId: string;
  isTeacher: boolean;
}

interface Student {
  id: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface AttendanceRecord {
  id: string;
  student_id: string;
  status: 'present' | 'absent' | 'late';
  date: string;
}

export function AttendanceTracker({ courseId, isTeacher }: AttendanceTrackerProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [existingAttendance, setExistingAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isTeacher) {
      fetchStudents();
    }
    fetchAttendance();
  }, [courseId, selectedDate]);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('enrollments')
      .select('student_id, profiles!enrollments_student_id_fkey(id, full_name, email)')
      .eq('course_id', courseId);

    if (error) {
      console.error('Error fetching students:', error);
      return;
    }

    setStudents(data as any);
  };

  const fetchAttendance = async () => {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('course_id', courseId)
      .eq('date', selectedDate);

    if (error) {
      console.error('Error fetching attendance:', error);
      return;
    }

    setExistingAttendance(data || []);
    
    // Initialize attendance state
    const attendanceMap: Record<string, string> = {};
    data?.forEach((record) => {
      attendanceMap[record.student_id] = record.status;
    });
    setAttendance(attendanceMap);
  };

  const handleMarkAttendance = async () => {
    setIsLoading(true);

    try {
      const attendanceRecords = Object.entries(attendance).map(([studentId, status]) => ({
        course_id: courseId,
        student_id: studentId,
        date: selectedDate,
        status: status as 'present' | 'absent' | 'late',
      }));

      // Delete existing attendance for the date
      await supabase
        .from('attendance')
        .delete()
        .eq('course_id', courseId)
        .eq('date', selectedDate);

      // Insert new attendance records
      const { error } = await supabase
        .from('attendance')
        .insert(attendanceRecords);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Attendance marked successfully',
      });

      fetchAttendance();
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark attendance',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'absent':
        return <X className="w-4 h-4 text-red-500" />;
      case 'late':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">Attendance</h2>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border rounded-md"
        />
      </div>

      {isTeacher ? (
        <>
          <div className="space-y-3 mb-6">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{student.profiles.full_name}</p>
                  <p className="text-sm text-muted-foreground">{student.profiles.email}</p>
                </div>
                <Select
                  value={attendance[student.id] || 'present'}
                  onValueChange={(value) =>
                    setAttendance((prev) => ({ ...prev, [student.id]: value }))
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        Present
                      </div>
                    </SelectItem>
                    <SelectItem value="absent">
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4 text-red-500" />
                        Absent
                      </div>
                    </SelectItem>
                    <SelectItem value="late">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-500" />
                        Late
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <Button
            onClick={handleMarkAttendance}
            disabled={isLoading || students.length === 0}
            className="w-full"
          >
            {isLoading ? 'Saving...' : 'Mark Attendance'}
          </Button>
        </>
      ) : (
        <div className="space-y-3">
          {existingAttendance.length > 0 ? (
            existingAttendance.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <span className="text-sm">{format(new Date(record.date), 'PPP')}</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(record.status)}
                  <span className="font-medium capitalize">{record.status}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No attendance records for this date
            </p>
          )}
        </div>
      )}
    </Card>
  );
}