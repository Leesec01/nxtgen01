import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Users, TrendingUp } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: BookOpen,
      title: "Rich Course Library",
      description: "Access a wide range of courses tailored to your learning goals",
    },
    {
      icon: Users,
      title: "Expert Teachers",
      description: "Learn from experienced educators dedicated to your success",
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description: "Monitor your learning journey with detailed analytics",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold gradient-text">EduHub LMS</h1>
          </div>
          <Button onClick={() => navigate("/auth")}>Get Started</Button>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-5xl font-bold tracking-tight">
              Transform Your Learning Experience
            </h2>
            <p className="text-xl text-muted-foreground">
              A modern learning management system for students and teachers. 
              Collaborate, learn, and grow together.
            </p>
            <div className="flex gap-4 justify-center pt-8">
              <Button size="lg" onClick={() => navigate("/auth")}>
                Start Learning
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
                I'm a Teacher
              </Button>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="card-gradient p-6 rounded-xl hover:scale-105 transition-transform"
              >
                <feature.icon className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 py-20 text-center">
          <div className="card-gradient p-12 rounded-2xl max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold mb-4">Ready to get started?</h3>
            <p className="text-muted-foreground mb-8">
              Join thousands of learners and educators already using EduHub
            </p>
            <Button size="lg" onClick={() => navigate("/auth")}>
              Create Your Account
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2025 EduHub LMS. Built with modern web technologies.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
