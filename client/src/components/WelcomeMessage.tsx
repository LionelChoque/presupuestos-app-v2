import { useState, useEffect } from "react";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export function WelcomeMessage() {
  const [showWelcome, setShowWelcome] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Verificar si es la primera vez que el usuario inicia sesión después de ser aprobado
    if (user) {
      const hasSeenWelcome = localStorage.getItem(`welcome_seen_${user.id}`);
      if (!hasSeenWelcome) {
        // Mostrar el mensaje después de un breve retraso
        const timer = setTimeout(() => {
          setShowWelcome(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const dismissWelcome = () => {
    if (user) {
      localStorage.setItem(`welcome_seen_${user.id}`, "true");
    }
    setShowWelcome(false);
  };

  if (!showWelcome || !user) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl text-primary">¡Bienvenido(a)!</CardTitle>
            <Button variant="ghost" size="icon" onClick={dismissWelcome}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Tu cuenta ha sido aprobada y ahora tienes acceso completo al sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-md bg-primary/5 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">¿Qué puedes hacer ahora?</h3>
            <ul className="space-y-2 ml-5 list-disc text-sm">
              <li>Ver y gestionar presupuestos desde la sección "Presupuestos"</li>
              <li>Dar seguimiento a tus tareas pendientes en la sección "Tareas"</li>
              <li>Importar nuevos datos desde archivos CSV</li>
              <li>Consultar estadísticas y gráficos en el Dashboard</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground">
            Si tienes alguna duda o necesitas ayuda, contacta al administrador
            del sistema o consulta la guía de usuario que aparecerá en cada sección.
          </p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={dismissWelcome}>
            Comenzar a usar el sistema
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}