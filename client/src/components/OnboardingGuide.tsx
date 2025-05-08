import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface OnboardingStep {
  title: string;
  description: string;
  image?: string;
  additionalContent?: React.ReactNode;
}

export function OnboardingGuide() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const { user } = useAuth();

  // Verificar si el usuario ya ha visto el onboarding
  useEffect(() => {
    const onboardingSeen = localStorage.getItem(`onboarding_seen_${user?.id}`);
    if (user && !onboardingSeen) {
      // Solo mostrar después de un breve retraso para no interrumpir inmediatamente
      const timer = setTimeout(() => {
        setOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setHasSeenOnboarding(true);
    }
  }, [user]);

  // Marcar onboarding como visto al cerrar
  const handleClose = () => {
    if (user) {
      localStorage.setItem(`onboarding_seen_${user.id}`, "true");
      setHasSeenOnboarding(true);
    }
    setOpen(false);
  };

  // Pasos del onboarding
  const steps: OnboardingStep[] = [
    {
      title: "¡Bienvenido al Sistema de Seguimiento de Presupuestos!",
      description:
        "Esta guía te ayudará a conocer las principales funciones del sistema y cómo sacarle el máximo provecho.",
      additionalContent: (
        <div className="grid place-items-center py-6">
          <div className="w-24 h-24 rounded-full bg-primary/10 grid place-items-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>
          <p className="text-center text-muted-foreground">
            Vamos a mostrarte lo básico para que puedas comenzar a usar el sistema rápidamente.
          </p>
        </div>
      ),
    },
    {
      title: "Dashboard Principal",
      description:
        "En el dashboard encontrarás un resumen de los presupuestos activos, alertas importantes y estadísticas sobre el estado general de tu negocio.",
      additionalContent: (
        <div className="border rounded-md p-4 my-4 bg-muted/50">
          <ul className="space-y-2">
            <li className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
              <span>Visualiza estadísticas clave como presupuestos pendientes y vencidos</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
              <span>Accede a los presupuestos que requieren acción inmediata</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
              <span>Consulta el rendimiento de usuarios y actividad reciente</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "Gestión de Presupuestos",
      description:
        "En la sección de Presupuestos podrás ver todos los presupuestos, filtrarlos, y acceder a sus detalles. También podrás importar nuevos presupuestos desde archivos CSV.",
      additionalContent: (
        <div className="border rounded-md p-4 my-4 bg-muted/50">
          <ul className="space-y-2">
            <li className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
              <span>Utiliza el botón "Importar CSV" para cargar presupuestos desde archivos</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
              <span>Filtra por estado, fechas o tipo de presupuesto</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
              <span>Haz clic en cualquier presupuesto para ver sus detalles completos</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "Seguimiento de Tareas",
      description:
        "La sección de Tareas te muestra las acciones pendientes relacionadas con los presupuestos que requieren tu atención.",
      additionalContent: (
        <div className="border rounded-md p-4 my-4 bg-muted/50">
          <ul className="space-y-2">
            <li className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
              <span>Marca tareas como completadas cuando realices las acciones necesarias</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
              <span>Prioriza tus tareas según la fecha de vencimiento</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
              <span>Accede directamente a los detalles del presupuesto desde cada tarea</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "Reportes y Análisis",
      description:
        "En la sección de Reportes podrás generar informes detallados sobre el rendimiento de tus presupuestos y analizar tendencias.",
      additionalContent: (
        <div className="grid place-items-center py-4">
          <p className="text-center text-muted-foreground mb-4">
            Los reportes te ayudarán a tomar mejores decisiones basadas en datos precisos sobre tus presupuestos.
          </p>
        </div>
      ),
    },
    {
      title: "¡Estás listo para comenzar!",
      description:
        "Ya conoces las funciones básicas del sistema. Recuerda que puedes acceder a esta guía en cualquier momento desde el menú de ayuda.",
      additionalContent: (
        <div className="grid place-items-center py-6">
          <div className="w-24 h-24 rounded-full bg-primary/10 grid place-items-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>
          <p className="text-center text-muted-foreground">
            Si tienes alguna duda, contacta al administrador del sistema o consulta la documentación.
          </p>
        </div>
      ),
    },
  ];

  // Si el usuario ya vio el onboarding, no renderizar nada
  if (hasSeenOnboarding) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] md:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-center">
            {steps[currentStep].title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {steps[currentStep].description}
          </DialogDescription>
        </DialogHeader>

        {/* Contenido adicional del paso actual */}
        {steps[currentStep].additionalContent}

        {/* Indicador de pasos */}
        <div className="flex justify-center gap-1 py-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full ${
                index === currentStep ? "w-6 bg-primary" : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex flex-row justify-between sm:justify-between">
          <div>
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                className="gap-1"
                onClick={() => setCurrentStep((prev) => prev - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Omitir
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                className="gap-1"
                onClick={() => setCurrentStep((prev) => prev + 1)}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleClose}>
                Finalizar
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}