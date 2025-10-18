import { useOutletContext } from 'react-router-dom';
import { AIAssistant } from '@/components/ai/AIAssistant';

interface OutletContext {
  userRole: 'student' | 'teacher';
  userId: string;
}

export default function AIChat() {
  const { userRole, userId } = useOutletContext<OutletContext>();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">AI Assistant</h1>
        <p className="text-muted-foreground">
          Get instant answers about your courses, assignments, and performance
        </p>
      </div>

      <AIAssistant userId={userId} userRole={userRole} />
    </div>
  );
}