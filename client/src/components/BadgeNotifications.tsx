import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge, UserBadge } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { Award, Trophy, Star, Zap, Crown } from 'lucide-react';
import { animate, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Mapa de iconos para las insignias
const BadgeIconMap: Record<string, React.ReactNode> = {
  "award": <Award className="h-8 w-8" />,
  "trophy": <Trophy className="h-8 w-8" />,
  "star": <Star className="h-8 w-8" />,
  "zap": <Zap className="h-8 w-8" />,
  "crown": <Crown className="h-8 w-8" />
};

interface BadgeNotificationProps {
  badge: Badge;
  onClose: () => void;
}

function BadgeNotification({ badge, onClose }: BadgeNotificationProps) {
  // Animación para insignias ganadas
  const iconElement = BadgeIconMap[badge.icono] || <Award className="h-8 w-8" />;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      transition={{ 
        type: "spring", 
        stiffness: 200, 
        damping: 15 
      }}
    >
      <Toast className="w-auto max-w-md">
        <div className="flex items-start gap-4">
          <div 
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-full", 
              "bg-opacity-20"
            )}
            style={{ backgroundColor: `${badge.color}30`, color: badge.color }}
          >
            {iconElement}
          </div>
          <div className="grid gap-1">
            <ToastTitle className="text-xl">
              ¡Insignia desbloqueada!
            </ToastTitle>
            <ToastDescription className="font-medium text-lg">
              {badge.nombre}
            </ToastDescription>
            <ToastDescription className="text-sm">
              {badge.descripcion}
            </ToastDescription>
          </div>
        </div>
        <ToastClose onClick={onClose} />
      </Toast>
    </motion.div>
  );
}

export function BadgeNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<(UserBadge & { badge: Badge })[]>([]);
  
  // Consulta para obtener insignias completadas recientemente
  const { data: recentBadges, isLoading } = useQuery({
    queryKey: ['/api/users', user?.id, 'badges/recent'],
    enabled: !!user?.id,
    refetchInterval: 30000 // Comprobar cada 30 segundos
  });
  
  // Mutación para marcar como mostrada
  const markAsShownMutation = useMutation({
    mutationFn: async ({ userId, badgeId }: { userId: number, badgeId: number }) => {
      const res = await apiRequest('PATCH', `/api/users/${userId}/badges/${badgeId}/shown`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'badges/recent'] });
    }
  });
  
  // Efecto para mostrar notificaciones
  useEffect(() => {
    if (recentBadges && recentBadges.length > 0) {
      // Filtrar solo las insignias completadas que no se han mostrado aún
      const newNotifications = recentBadges.filter(
        badge => badge.completado && !badge.mostrado
      );
      
      if (newNotifications.length > 0) {
        setNotifications(prev => [...prev, ...newNotifications]);
      }
    }
  }, [recentBadges]);
  
  // Manejar cierre de notificación
  const handleClose = (userBadge: UserBadge & { badge: Badge }) => {
    if (user) {
      // Marcar como mostrada en el servidor
      markAsShownMutation.mutate({ 
        userId: user.id, 
        badgeId: userBadge.badgeId 
      });
      
      // Quitar de las notificaciones locales
      setNotifications(prev => 
        prev.filter(n => n.badgeId !== userBadge.badgeId)
      );
    }
  };
  
  if (!user || notifications.length === 0) {
    return null;
  }
  
  return (
    <ToastProvider>
      {notifications.map((notification) => (
        <BadgeNotification
          key={notification.badgeId}
          badge={notification.badge}
          onClose={() => handleClose(notification)}
        />
      ))}
      <ToastViewport className="fixed bottom-0 right-0 flex flex-col p-6 gap-2 w-auto max-w-md z-50" />
    </ToastProvider>
  );
}