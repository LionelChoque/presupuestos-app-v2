import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Badge, UserBadge } from '@shared/schema';
import {
  Award,
  Plus,
  Settings,
  Trophy,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProgressBar } from '@/components/ProgressBar';

// Componente para mostrar una insignia individual
interface BadgeCardProps {
  badge: Badge;
  userBadge?: UserBadge & { badge: Badge };
  isAdmin?: boolean;
  onAssign?: (badgeId: number) => void;
  onEdit?: (badge: Badge) => void;
  onDelete?: (badgeId: number) => void;
  onUpdateProgress?: (badgeId: number, progress: number) => void;
}

const BadgeCard = ({
  badge,
  userBadge,
  isAdmin = false,
  onAssign,
  onEdit,
  onDelete,
  onUpdateProgress
}: BadgeCardProps) => {
  // Usar progresoActual en lugar de progreso
  const initialProgress = userBadge?.progresoActual ? parseInt(userBadge.progresoActual) : 0;
  const [progress, setProgress] = useState(initialProgress);
  
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseInt(e.target.value);
    setProgress(newProgress);
  };
  
  const saveProgress = () => {
    if (onUpdateProgress) {
      onUpdateProgress(badge.id, progress);
    }
  };
  
  // Determinar qué icono usar
  let BadgeIcon;
  switch (badge.icono) {
    case 'award':
      BadgeIcon = Award;
      break;
    case 'trophy':
      BadgeIcon = Trophy;
      break;
    default:
      BadgeIcon = Award;
  }
  
  return (
    <Card className="w-full overflow-hidden flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{badge.nombre}</CardTitle>
          {isAdmin && (
            <div className="flex space-x-1">
              <Button 
                variant="outline" 
                className="h-8 w-8 p-0"
                onClick={() => onEdit?.(badge)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                className="h-8 w-8 p-0 text-red-500"
                onClick={() => onDelete?.(badge.id)}
              >
                <span className="text-sm font-bold">×</span>
              </Button>
            </div>
          )}
        </div>
        <CardDescription>{badge.descripcion}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-4 flex-grow flex flex-col items-center justify-center">
        <div 
          className="rounded-full p-6 mb-3 flex items-center justify-center" 
          style={{ backgroundColor: `${badge.color}20` }}
        >
          <BadgeIcon className="h-10 w-10" style={{ color: badge.color }} />
        </div>
        <div className="text-sm text-gray-600 text-center">
          <p><strong>Objetivo:</strong> {badge.tipoObjetivo}</p>
          <p><strong>Meta:</strong> {badge.valorObjetivo}</p>
        </div>
        {userBadge && (
          <div className="w-full mt-4">
            <ProgressBar
              value={parseInt(userBadge.progresoActual || '0')}
              color={badge.color}
              label={`${userBadge.progresoActual || '0'}%`}
            />
            {userBadge.completado ? (
              <div className="mt-2 text-center text-green-600 font-medium">
                ¡Completado! 🎉
              </div>
            ) : (
              <div className="mt-2 w-full flex items-center space-x-2">
                <Input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={handleProgressChange}
                  className="flex-grow"
                />
                <Button size="sm" onClick={saveProgress} className="whitespace-nowrap">
                  Actualizar
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 mt-auto">
        {onAssign && (
          <Button 
            variant="default"
            className="w-full" 
            onClick={() => onAssign(badge.id)}
          >
            Asignar Insignia
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// Formulario para crear o editar insignias
interface BadgeFormProps {
  badge?: Badge;
  onSubmit: (data: Partial<Badge>) => void;
  onCancel: () => void;
}

const BadgeForm = ({ badge, onSubmit, onCancel }: BadgeFormProps) => {
  const [formData, setFormData] = useState<Partial<Badge>>({
    nombre: badge?.nombre || '',
    descripcion: badge?.descripcion || '',
    tipoObjetivo: badge?.tipoObjetivo || 'Presupuestos Finalizados',
    valorObjetivo: badge?.valorObjetivo || '10',
    icono: badge?.icono || 'award',
    color: badge?.color || '#4CAF50',
    publico: badge?.publico ?? true,
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 py-2 pb-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            name="nombre"
            placeholder="Ej. Experto en Presupuestos"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea
            id="descripcion"
            name="descripcion"
            placeholder="Describe los requisitos para obtener esta insignia..."
            value={formData.descripcion}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tipoObjetivo">Tipo de Objetivo</Label>
            <Select 
              value={formData.tipoObjetivo} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, tipoObjetivo: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Presupuestos Finalizados">Presupuestos Finalizados</SelectItem>
                <SelectItem value="Monto Total">Monto Total</SelectItem>
                <SelectItem value="Clientes Nuevos">Clientes Nuevos</SelectItem>
                <SelectItem value="Tareas Completadas">Tareas Completadas</SelectItem>
                <SelectItem value="Días Consecutivos">Días Consecutivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="valorObjetivo">Valor Objetivo</Label>
            <Input
              id="valorObjetivo"
              name="valorObjetivo"
              type="text"
              placeholder="Ej. 100"
              value={formData.valorObjetivo}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="icono">Icono</Label>
            <Select 
              value={formData.icono} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, icono: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un icono" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="award">Premio</SelectItem>
                <SelectItem value="trophy">Trofeo</SelectItem>
                <SelectItem value="star">Estrella</SelectItem>
                <SelectItem value="zap">Rayo</SelectItem>
                <SelectItem value="crown">Corona</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input
              id="color"
              name="color"
              type="color"
              value={formData.color}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="publico"
            checked={formData.publico}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, publico: checked }))}
          />
          <Label htmlFor="publico" className="ml-2">Disponible para todos los usuarios</Label>
        </div>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {badge ? 'Actualizar' : 'Crear'} Insignia
        </Button>
      </DialogFooter>
    </form>
  );
};

// Página principal de insignias
export default function BadgesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('mis-insignias');
  const [isCreatingBadge, setIsCreatingBadge] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | undefined>(undefined);
  
  // Consultas para obtener datos
  const { data: allBadges, isLoading: isLoadingAllBadges } = useQuery<Badge[]>({
    queryKey: ['/api/badges'],
    enabled: !!user
  });
  
  const { data: userBadges, isLoading: isLoadingUserBadges } = useQuery<(UserBadge & { badge: Badge })[]>({
    queryKey: ['/api/users', user?.id, 'badges'],
    enabled: !!user?.id
  });
  
  // Mutaciones para acciones CRUD
  const createBadgeMutation = useMutation({
    mutationFn: async (badgeData: Partial<Badge>) => {
      const res = await apiRequest('POST', '/api/badges', badgeData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/badges'] });
      toast({
        title: 'Insignia creada',
        description: 'La insignia se ha creado correctamente.',
        variant: 'default'
      });
      setIsCreatingBadge(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al crear insignia',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  const updateBadgeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Badge> }) => {
      const res = await apiRequest('PATCH', `/api/badges/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/badges'] });
      toast({
        title: 'Insignia actualizada',
        description: 'La insignia se ha actualizado correctamente.',
        variant: 'default'
      });
      setEditingBadge(undefined);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al actualizar insignia',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  const deleteBadgeMutation = useMutation({
    mutationFn: async (badgeId: number) => {
      await apiRequest('DELETE', `/api/badges/${badgeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/badges'] });
      toast({
        title: 'Insignia eliminada',
        description: 'La insignia se ha eliminado correctamente.',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al eliminar insignia',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  const assignBadgeMutation = useMutation({
    mutationFn: async (badgeId: number) => {
      const res = await apiRequest('POST', `/api/users/${user?.id}/badges`, { badgeId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'badges'] });
      toast({
        title: 'Insignia asignada',
        description: 'La insignia ha sido asignada correctamente.',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al asignar insignia',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  const updateProgressMutation = useMutation({
    mutationFn: async ({ badgeId, progress }: { badgeId: number; progress: number }) => {
      const res = await apiRequest('PATCH', `/api/users/${user?.id}/badges/${badgeId}/progress`, { progress });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'badges'] });
      toast({
        title: 'Progreso actualizado',
        description: 'El progreso de la insignia ha sido actualizado.',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al actualizar progreso',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Funciones para manejar eventos
  const handleCreateBadge = (data: Partial<Badge>) => {
    createBadgeMutation.mutate(data);
  };
  
  const handleUpdateBadge = (data: Partial<Badge>) => {
    if (editingBadge) {
      updateBadgeMutation.mutate({ id: editingBadge.id, data });
    }
  };
  
  const handleDeleteBadge = (badgeId: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta insignia?')) {
      deleteBadgeMutation.mutate(badgeId);
    }
  };
  
  const handleAssignBadge = (badgeId: number) => {
    assignBadgeMutation.mutate(badgeId);
  };
  
  const handleUpdateProgress = (badgeId: number, progress: number) => {
    updateProgressMutation.mutate({ badgeId, progress });
  };
  
  // Filtrar insignias para la pestaña actual
  const filteredBadges = Array.isArray(allBadges) ? allBadges.filter(badge => {
    if (activeTab === 'todas-insignias') {
      return true;
    }
    // Para la pestaña "disponibles", mostrar insignias públicas no asignadas al usuario
    return badge.publico && (!Array.isArray(userBadges) || !userBadges.length ? true : !userBadges.some((ub) => ub.badge.id === badge.id));
  }) : [];
  
  // Verificar si el usuario es administrador
  const isAdmin = user?.rol === 'admin';
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Insignias de Logros</h1>
        {isAdmin && (
          <Dialog open={isCreatingBadge} onOpenChange={setIsCreatingBadge}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Insignia
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Crear Nueva Insignia</DialogTitle>
                <DialogDescription>
                  Define los detalles de la nueva insignia de logro.
                </DialogDescription>
              </DialogHeader>
              <BadgeForm
                onSubmit={handleCreateBadge}
                onCancel={() => setIsCreatingBadge(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mis-insignias">Mis Insignias</TabsTrigger>
          <TabsTrigger value="disponibles">Disponibles</TabsTrigger>
          {isAdmin && <TabsTrigger value="todas-insignias">Gestionar Todas</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="mis-insignias" className="pt-4">
          {isLoadingUserBadges ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="w-full max-w-[300px]">
                  <CardHeader>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full mt-2" />
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <Skeleton className="h-4 w-full mt-4" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-8 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : userBadges?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userBadges.map(userBadge => (
                <BadgeCard
                  key={userBadge.badgeId}
                  badge={userBadge.badge}
                  userBadge={userBadge}
                  onUpdateProgress={handleUpdateProgress}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Trophy className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No tienes insignias asignadas</h3>
              <p className="text-gray-500 mb-4">
                Explora las insignias disponibles y asígnalas para comenzar a ganarlas.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('disponibles')}
              >
                Ver Insignias Disponibles
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="disponibles" className="pt-4">
          {isLoadingAllBadges ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="w-full max-w-[300px]">
                  <CardHeader>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full mt-2" />
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <Skeleton className="h-4 w-full mt-4" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-8 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filteredBadges?.filter(b => b.publico).length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBadges
                .filter(badge => badge.publico)
                .map(badge => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    onAssign={handleAssignBadge}
                  />
                ))
              }
            </div>
          ) : (
            <div className="text-center py-16">
              <Award className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">No hay insignias disponibles</h3>
              <p className="text-gray-500">
                Actualmente no hay insignias públicas disponibles para asignar.
              </p>
            </div>
          )}
        </TabsContent>
        
        {isAdmin && (
          <TabsContent value="todas-insignias" className="pt-4">
            {isLoadingAllBadges ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="w-full max-w-[300px]">
                    <CardHeader>
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full mt-2" />
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <Skeleton className="h-4 w-full mt-4" />
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-8 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : allBadges?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allBadges.map(badge => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    isAdmin={true}
                    onEdit={setEditingBadge}
                    onDelete={handleDeleteBadge}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Settings className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium">No hay insignias creadas</h3>
                <p className="text-gray-500">
                  Como administrador, puedes crear nuevas insignias para los usuarios.
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => setIsCreatingBadge(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Insignia
                </Button>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
      
      {/* Diálogo para editar insignias */}
      {isAdmin && (
        <Dialog open={!!editingBadge} onOpenChange={(open) => !open && setEditingBadge(undefined)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Insignia</DialogTitle>
              <DialogDescription>
                Modifica los detalles de la insignia.
              </DialogDescription>
            </DialogHeader>
            {editingBadge && (
              <BadgeForm
                badge={editingBadge}
                onSubmit={handleUpdateBadge}
                onCancel={() => setEditingBadge(undefined)}
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}