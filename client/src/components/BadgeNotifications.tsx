import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Badge, UserBadge } from '@shared/schema';
import { Award, Trophy, Star, Zap, Crown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BadgeNotificationProps {
  badge: Badge;
  onClose: () => void;
}

function BadgeNotification({ badge, onClose }: BadgeNotificationProps) {
  const BadgeIconMap: Record<string, React.ReactNode> = {
    "award": <Award className="h-6 w-6" />,
    "trophy": <Trophy className="h-6 w-6" />,
    "star": <Star className="h-6 w-6" />,
    "zap": <Zap className="h-6 w-6" />,
    "crown": <Crown className="h-6 w-6" />
  };

  const iconElement = BadgeIconMap[badge.icono] || <Award className="h-6 w-6" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm border border-gray-200 z-50"
    >
      <div className="flex items-start">
        <div 
          className="flex-shrink-0 p-2 rounded-full mr-3" 
          style={{ backgroundColor: `${badge.color}30`, color: badge.color }}
        >
          {iconElement}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">¡Insignia completada!</h3>
          <p className="text-sm font-medium mb-1">{badge.nombre}</p>
          <p className="text-xs text-gray-500">{badge.descripcion}</p>
        </div>
        <button 
          onClick={onClose} 
          className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-2 pt-2 border-t border-gray-100">
        <button
          onClick={onClose}
          className="text-xs text-right w-full font-medium text-blue-600 hover:text-blue-800"
        >
          Ver mis insignias
        </button>
      </div>
    </motion.div>
  );
}

export function BadgeNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<(UserBadge & { badge: Badge })[]>([]);

  useEffect(() => {
    if (!user) return;

    const checkForNewBadges = async () => {
      try {
        const res = await apiRequest('GET', `/api/users/${user.id}/badges/recent`);
        if (res.ok) {
          const recentBadges = await res.json();
          // Filtrar solo las insignias completadas y no mostradas
          const unshownBadges = recentBadges.filter(
            (badge: UserBadge & { badge: Badge }) => badge.completado && !badge.mostrado
          );
          
          if (unshownBadges.length > 0) {
            setNotifications(unshownBadges);
          }
        }
      } catch (error) {
        console.error('Error al obtener insignias recientes:', error);
      }
    };

    checkForNewBadges();
    // Verificar periódicamente si hay nuevas insignias (cada 5 minutos)
    const interval = setInterval(checkForNewBadges, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  const handleClose = async (userBadge: UserBadge & { badge: Badge }) => {
    try {
      // Marcar la insignia como mostrada en el servidor
      await apiRequest(
        'PATCH',
        `/api/users/${user!.id}/badges/${userBadge.badgeId}/shown`,
        {}
      );
      
      // Eliminar la notificación
      setNotifications(prev => 
        prev.filter(notification => notification.badgeId !== userBadge.badgeId)
      );
    } catch (error) {
      console.error('Error al marcar insignia como mostrada:', error);
    }
  };

  return (
    <AnimatePresence>
      {notifications.map(notification => (
        <BadgeNotification
          key={notification.badgeId}
          badge={notification.badge}
          onClose={() => handleClose(notification)}
        />
      ))}
    </AnimatePresence>
  );
}