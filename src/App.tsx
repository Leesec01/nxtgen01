import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import Courses from "./pages/Courses";
import Assignments from "./pages/Assignments";
import Grades from "./pages/Grades";
import Profile from "./pages/Profile";
import CourseDetail from "./pages/CourseDetail";
import StudentCourseView from "./pages/StudentCourseView";
import AIChat from "./pages/AIChat";
import Attendance from "./pages/Attendance";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/grades" element={<Grades />} />
            <Route path="/ai-chat" element={<AIChat />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/course/:courseId" element={<CourseDetail />} />
            <Route path="/student-course/:courseId" element={<StudentCourseView />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
