import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Badge, UserBadge } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressBar } from "@/components/ProgressBar";
import { Award, Trophy, Star, Zap, Crown, Plus, Settings, Trash, Check, PlusCircle, Edit } from "lucide-react";
import { Layout } from "@/components/Layout";

// Mapa de iconos para las insignias
const BadgeIconMap: Record<string, React.ReactNode> = {
  "award": <Award className="h-8 w-8" />,
  "trophy": <Trophy className="h-8 w-8" />,
  "star": <Star className="h-8 w-8" />,
  "zap": <Zap className="h-8 w-8" />,
  "crown": <Crown className="h-8 w-8" />
};

// Componente para mostrar una insignia individual
const BadgeCard = ({ 
  badge, 
  userBadge, 
  onAssign, 
  onUpdateProgress,
  isAdmin = false,
  onEdit,
  onDelete
}: { 
  badge: Badge; 
  userBadge?: UserBadge & { badge: Badge }; 
  onAssign?: (badgeId: number) => void;
  onUpdateProgress?: (badgeId: number, progress: number) => void;
  isAdmin?: boolean;
  onEdit?: (badge: Badge) => void;
  onDelete?: (badgeId: number) => void;
}) => {
  const progress = userBadge ? Number(userBadge.progresoActual) : 0;
  const targetValue = Number(badge.valorObjetivo);
  const progressPercentage = Math.min(100, (progress / targetValue) * 100);
  const isCompleted = userBadge?.completado || false;
  
  // Componente de icono basado en el nombre
  const Icon = () => {
    const iconElement = BadgeIconMap[badge.icono] || <Award className="h-8 w-8" />;
    return (
      <div 
        className="p-3 rounded-full mb-2" 
        style={{ 
          backgroundColor: isCompleted ? `${badge.color}30` : '#f1f5f9',
          color: badge.color
        }}
      >
        {iconElement}
      </div>
    );
  };
  
  return (
    <Card className="w-full max-w-[300px] overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{badge.nombre}</CardTitle>
          {isAdmin && (
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" onClick={() => onEdit?.(badge)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete?.(badge.id)}>
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <CardDescription>{badge.descripcion}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <Icon />
        {userBadge ? (
          <>
            <div className="w-full mt-2">
              <ProgressBar 
                value={progressPercentage} 
                color={badge.color}
                label={isCompleted ? '¡Completado!' : `${progress} / ${targetValue}`}
              />
            </div>
            {!isCompleted && onUpdateProgress && (
              <div className="flex items-center space-x-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onUpdateProgress(badge.id, Math.min(targetValue, progress + targetValue * 0.1))}
                >
                  +10%
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onUpdateProgress(badge.id, Math.min(targetValue, progress + targetValue * 0.25))}
                >
                  +25%
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onUpdateProgress(badge.id, targetValue)}
                >
                  Completar
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="mt-2 text-sm text-gray-500">
            Meta: {targetValue} {badge.tipoObjetivo.replace(/_/g, ' ')}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        {!userBadge && onAssign && (
          <Button 
            className="w-full" 
            variant="outline"
            onClick={() => onAssign(badge.id)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Asignar
          </Button>
        )}
        {isCompleted && (
          <div className="w-full text-center p-2 bg-green-100 rounded-md text-green-800 font-medium">
            <Check className="inline-block mr-2 h-4 w-4" />
            Logro completado
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

// Componente de formulario para crear/editar insignias
const BadgeForm = ({
  badge,
  onSubmit,
  onCancel
}: {
  badge?: Badge;
  onSubmit: (data: Partial<Badge>) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    nombre: badge?.nombre || '',
    descripcion: badge?.descripcion || '',
    tipoObjetivo: badge?.tipoObjetivo || 'monto_total',
    valorObjetivo: badge?.valorObjetivo || '1000',
    icono: badge?.icono || 'award',
    color: badge?.color || '#FFD700',
    publico: badge?.publico || false
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : name === 'valorObjetivo' ? value : value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      valorObjetivo: formData.valorObjetivo.toString()
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            minLength={3}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <Input
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            required
            minLength={10}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tipoObjetivo">Tipo de Objetivo</Label>
            <select
              id="tipoObjetivo"
              name="tipoObjetivo"
              value={formData.tipoObjetivo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="monto_total">Monto Total</option>
              <option value="cantidad_presupuestos">Cantidad Presupuestos</option>
              <option value="dias_aprobacion">Días para Aprobación</option>
              <option value="cliente_fidelizado">Cliente Fidelizado</option>
              <option value="categoria_top">Top en Categoría</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="valorObjetivo">Valor Objetivo</Label>
            <Input
              id="valorObjetivo"
              name="valorObjetivo"
              type="number"
              value={formData.valorObjetivo}
              onChange={handleChange}
              required
              min="1"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="icono">Icono</Label>
            <select
              id="icono"
              name="icono"
              value={formData.icono}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="award">Premio</option>
              <option value="trophy">Trofeo</option>
              <option value="star">Estrella</option>
              <option value="zap">Rayo</option>
              <option value="crown">Corona</option>
            </select>
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
          <input
            id="publico"
            name="publico"
            type="checkbox"
            checked={formData.publico}
            onChange={handleChange}
            className="rounded border-gray-300"
          />
          <Label htmlFor="publico">Disponible para todos los usuarios</Label>
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
  const { data: allBadges, isLoading: isLoadingAllBadges } = useQuery({
    queryKey: ['/api/badges'],
    enabled: !!user
  });
  
  const { data: userBadges, isLoading: isLoadingUserBadges } = useQuery({
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
        variant: 'success'
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
        variant: 'success'
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
        variant: 'success'
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
        variant: 'success'
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
        variant: 'success'
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
  const filteredBadges = allBadges?.filter(badge => {
    if (activeTab === 'todas-insignias') {
      return true;
    }
    // Para la pestaña "disponibles", mostrar insignias públicas no asignadas al usuario
    return badge.publico && !userBadges?.some(ub => ub.badge.id === badge.id);
  });
  
  // Verificar si el usuario es administrador
  const isAdmin = user?.rol === 'admin';
  
  return (
    <Layout onImport={() => {}}>
      <div className="container mx-auto py-6">
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
      </div>
      
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
    </Layout>
  );
}