-- Create attendance status enum
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status attendance_status NOT NULL DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, student_id, date)
);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attendance
CREATE POLICY "Teachers can view attendance for their courses"
ON public.attendance
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = attendance.course_id
    AND courses.teacher_id = auth.uid()
  )
);

CREATE POLICY "Students can view their own attendance"
ON public.attendance
FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Teachers can mark attendance for their courses"
ON public.attendance
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = attendance.course_id
    AND courses.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can update attendance for their courses"
ON public.attendance
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = attendance.course_id
    AND courses.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can delete attendance for their courses"
ON public.attendance
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.courses
    WHERE courses.id = attendance.course_id
    AND courses.teacher_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();