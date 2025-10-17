import { useOutletContext } from "react-router-dom";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import TeacherDashboard from "@/components/dashboard/TeacherDashboard";

interface OutletContext {
  userRole: "student" | "teacher";
  userId: string;
}

const Courses = () => {
  const { userRole, userId } = useOutletContext<OutletContext>();

  return (
    <div>
      <h1 className="text-3xl font-bold gradient-text mb-6">Courses</h1>
      {userRole === "student" ? (
        <StudentDashboard userId={userId} />
      ) : (
        <TeacherDashboard userId={userId} />
      )}
    </div>
  );
};

export default Courses;
