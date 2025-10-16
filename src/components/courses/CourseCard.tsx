import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, User, CheckCircle2 } from "lucide-react";

interface CourseCardProps {
  course: any;
  isEnrolled: boolean;
  onEnroll?: (courseId: string) => void;
  onUnenroll?: (courseId: string) => void;
}

const CourseCard = ({ course, isEnrolled, onEnroll, onUnenroll }: CourseCardProps) => {
  return (
    <Card className="card-gradient hover:shadow-lg transition-all hover:scale-[1.02]">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="line-clamp-1">{course.title}</CardTitle>
            <CardDescription className="mt-2 line-clamp-2">
              {course.description || "No description available"}
            </CardDescription>
          </div>
          {isEnrolled && (
            <Badge className="ml-2 bg-accent text-accent-foreground">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Enrolled
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <User className="h-4 w-4 mr-2" />
          <span>{course.profiles?.full_name || "Unknown Teacher"}</span>
        </div>
        {course.duration && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            <span>{course.duration}</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {isEnrolled ? (
          onUnenroll && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onUnenroll(course.id)}
            >
              Unenroll
            </Button>
          )
        ) : (
          onEnroll && (
            <Button
              className="w-full"
              onClick={() => onEnroll(course.id)}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Enroll Now
            </Button>
          )
        )}
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
