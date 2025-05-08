import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";

export function ContextualHelp() {
  const [location] = useLocation();
  const [showHelp, setShowHelp] = useState(false);
  const [helpMessage, setHelpMessage] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Solo mostrar ayuda contextual si el usuario está autenticado
    if (!user) return;

    // Comprobar si el usuario ya ha visto este mensaje específico
    const messageKey = `contextual_help_${location}`;
    const hasSeenMessage = localStorage.getItem(messageKey);
    
    if (hasSeenMessage) {
      setShowHelp(false);
      return;
    }

    // Definir mensajes específicos para cada ruta
    const getHelpMessage = () => {
      switch (location) {
        case "/":
          return {
            title: "Bienvenido al Dashboard",
            description:
              "Aquí encontrarás un resumen de todos tus presupuestos activos y las tareas que requieren tu atención. Los gráficos te muestran la distribución por estado y tipo.",
          };
        case "/budgets":
          return {
            title: "Gestión de Presupuestos",
            description:
              "En esta sección puedes ver todos los presupuestos, filtrarlos por diferentes criterios y acceder a sus detalles. Usa el botón 'Importar CSV' para cargar nuevos presupuestos.",
          };
        case "/tasks":
          return {
            title: "Seguimiento de Tareas",
            description:
              "Aquí se muestran todas las tareas pendientes relacionadas con tus presupuestos. Marca como completadas las tareas que hayas realizado para mantener actualizado el seguimiento.",
          };
        case "/reports":
          return {
            title: "Reportes y Análisis",
            description:
              "Esta sección te permite generar informes detallados sobre el rendimiento de tus presupuestos. Puedes filtrar por fecha, tipo y estado para análisis específicos.",
          };
        case "/admin/users":
          return {
            title: "Administración de Usuarios",
            description:
              "Como administrador, puedes gestionar los usuarios del sistema, aprobar nuevos registros y monitorear su actividad. Recuerda que solo los usuarios aprobados tienen acceso al sistema.",
          };
        default:
          return null;
      }
    };

    const message = getHelpMessage();
    if (message) {
      setHelpMessage(message);
      setShowHelp(true);
    } else {
      setShowHelp(false);
    }
  }, [location, user]);

  const dismissHelp = () => {
    if (!location) return;
    
    // Marcar este mensaje como visto
    localStorage.setItem(`contextual_help_${location}`, "seen");
    setShowHelp(false);
  };

  if (!showHelp || !helpMessage) {
    return null;
  }

  return (
    <Alert className="mb-6 pr-12 relative border-primary/20 bg-primary/5">
      <AlertCircle className="h-4 w-4 text-primary" />
      <AlertTitle className="text-primary">{helpMessage.title}</AlertTitle>
      <AlertDescription className="text-foreground/80">
        {helpMessage.description}
      </AlertDescription>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-3 right-3 h-6 w-6 text-muted-foreground"
        onClick={dismissHelp}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Cerrar</span>
      </Button>
    </Alert>
  );
}