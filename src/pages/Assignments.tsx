import { useOutletContext } from "react-router-dom";
import AssignmentList from "@/components/assignments/AssignmentList";
import TeacherAssignments from "@/components/assignments/TeacherAssignments";

interface OutletContext {
  userRole: "student" | "teacher";
  userId: string;
}

const Assignments = () => {
  const { userRole, userId } = useOutletContext<OutletContext>();

  return (
    <div>
      <h1 className="text-3xl font-bold gradient-text mb-6">Assignments</h1>
      {userRole === "student" ? (
        <AssignmentList userId={userId} userRole={userRole} />
      ) : (
        <TeacherAssignments userId={userId} />
      )}
    </div>
  );
};

export default Assignments;
