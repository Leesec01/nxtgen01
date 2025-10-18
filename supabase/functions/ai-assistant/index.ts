import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, userId, userRole } = await req.json();

    if (!question || !userId || !userRole) {
      throw new Error('Question, userId, and userRole are required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch relevant data based on user role
    let contextData = '';
    
    if (userRole === 'teacher') {
      // Fetch teacher's courses
      const { data: courses } = await supabase
        .from('courses')
        .select('*, enrollments(count)')
        .eq('teacher_id', userId);

      // Fetch teacher's assignments
      const { data: assignments } = await supabase
        .from('assignments')
        .select('*, course:courses(title), submissions(count)')
        .eq('courses.teacher_id', userId);

      contextData = `
You are an AI assistant for a teacher in Nxtgen LMS.

Teacher's Courses:
${JSON.stringify(courses, null, 2)}

Teacher's Assignments:
${JSON.stringify(assignments, null, 2)}

Based on this data, answer the teacher's question helpfully and concisely.
`;
    } else {
      // Fetch student's enrollments
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('*, course:courses(title, description, teacher_id)')
        .eq('student_id', userId);

      // Fetch student's submissions
      const { data: submissions } = await supabase
        .from('submissions')
        .select('*, assignment:assignments(title, due_date, course_id)')
        .eq('student_id', userId);

      // Fetch student's attendance
      const { data: attendance } = await supabase
        .from('attendance')
        .select('*, course:courses(title)')
        .eq('student_id', userId);

      contextData = `
You are an AI assistant for a student in Nxtgen LMS.

Student's Enrolled Courses:
${JSON.stringify(enrollments, null, 2)}

Student's Submissions:
${JSON.stringify(submissions, null, 2)}

Student's Attendance:
${JSON.stringify(attendance, null, 2)}

Based on this data, answer the student's question helpfully and concisely.
`;
    }

    // Call Gemini API
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${contextData}\n\nUser Question: ${question}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        }),
      }
    );

    if (!geminiResponse.ok) {
      const error = await geminiResponse.text();
      console.error('Gemini API error:', error);
      throw new Error('Failed to get response from AI');
    }

    const geminiData = await geminiResponse.json();
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});