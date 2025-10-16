import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TeacherCourseCardProps {
  course: any;
  onUpdate: () => void;
}

const TeacherCourseCard = ({ course, onUpdate }: TeacherCourseCardProps) => {
  const navigate = useNavigate();
  const studentCount = course.enrollments?.[0]?.count || 0;
  const assignmentCount = course.assignments?.[0]?.count || 0;

  return (
    <Card className="card-gradient hover:shadow-lg transition-all hover:scale-[1.02]">
      <CardHeader>
        <CardTitle className="line-clamp-1">{course.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {course.description || "No description available"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-muted-foreground">
            <Users className="h-4 w-4 mr-2" />
            <span>{studentCount} Students</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <FileText className="h-4 w-4 mr-2" />
            <span>{assignmentCount} Assignments</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate(`/course/${course.id}`)}
        >
          Manage Course
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TeacherCourseCard;
