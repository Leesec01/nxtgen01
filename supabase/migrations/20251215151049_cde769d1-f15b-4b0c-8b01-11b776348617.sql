-- Create storage bucket for course files
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-files', 'course-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create table for course files
CREATE TABLE public.course_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  uploader_role TEXT NOT NULL CHECK (uploader_role IN ('teacher', 'student')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.course_files ENABLE ROW LEVEL SECURITY;

-- Teachers can upload files to their courses
CREATE POLICY "Teachers can upload files to their courses"
ON public.course_files
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = course_files.course_id
    AND courses.teacher_id = auth.uid()
  )
  OR
  (
    uploader_role = 'student' AND
    auth.uid() = uploader_id AND
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.course_id = course_files.course_id
      AND enrollments.student_id = auth.uid()
    )
  )
);

-- Teachers can view all files in their courses
CREATE POLICY "Teachers can view files in their courses"
ON public.course_files
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = course_files.course_id
    AND courses.teacher_id = auth.uid()
  )
);

-- Students can view teacher files and their own files
CREATE POLICY "Students can view course files"
ON public.course_files
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM enrollments
    WHERE enrollments.course_id = course_files.course_id
    AND enrollments.student_id = auth.uid()
  )
  AND (uploader_role = 'teacher' OR uploader_id = auth.uid())
);

-- Teachers can delete files in their courses
CREATE POLICY "Teachers can delete files in their courses"
ON public.course_files
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = course_files.course_id
    AND courses.teacher_id = auth.uid()
  )
);

-- Students can delete their own files
CREATE POLICY "Students can delete their own files"
ON public.course_files
FOR DELETE
USING (
  uploader_id = auth.uid() AND uploader_role = 'student'
);

-- Storage policies for course-files bucket
CREATE POLICY "Anyone can view course files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'course-files');

CREATE POLICY "Authenticated users can upload course files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'course-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own uploaded files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'course-files' AND auth.uid()::text = (storage.foldername(name))[1]);