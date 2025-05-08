import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays } from 'date-fns';
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Filter, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Tipo para actividades de usuario
interface UserActivity {
  id: number;
  userId: number;
  username: string;
  tipo: string;
  descripcion: string;
  timestamp: string;
  detalles?: Record<string, any>;
  entidadId?: string;
}

// Componente para visualizar detalles técnicos
const ActivityDetails = ({ detalles }: { detalles?: Record<string, any> }) => {
  if (!detalles || Object.keys(detalles).length === 0) {
    return <p className="text-xs text-muted-foreground">No hay detalles disponibles</p>;
  }

  return (
    <div className="text-xs space-y-1 mt-2">
      <details>
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
          Ver detalles técnicos
        </summary>
        <div className="p-2 bg-muted/30 rounded-md mt-1 max-h-40 overflow-auto text-muted-foreground">
          <pre>{JSON.stringify(detalles, null, 2)}</pre>
        </div>
      </details>
    </div>
  );
};

// Aplicar filtro de tipo para obtener un estilo de badge
const getActivityTypeBadge = (tipo: string) => {
  const typeMap: Record<string, { color: string, label: string }> = {
    'login': { color: 'bg-blue-100 text-blue-800', label: 'Sesión iniciada' },
    'logout': { color: 'bg-gray-100 text-gray-800', label: 'Sesión cerrada' },
    'budget_create': { color: 'bg-green-100 text-green-800', label: 'Presupuesto creado' },
    'budget_update': { color: 'bg-yellow-100 text-yellow-800', label: 'Presupuesto actualizado' },
    'budget_finalized': { color: 'bg-purple-100 text-purple-800', label: 'Presupuesto finalizado' },
    'contact_create': { color: 'bg-indigo-100 text-indigo-800', label: 'Contacto creado' },
    'contact_update': { color: 'bg-violet-100 text-violet-800', label: 'Contacto actualizado' },
    'import_csv': { color: 'bg-orange-100 text-orange-800', label: 'CSV importado' },
    'user_create': { color: 'bg-teal-100 text-teal-800', label: 'Usuario creado' },
    'user_update': { color: 'bg-sky-100 text-sky-800', label: 'Usuario actualizado' },
    'user_approve': { color: 'bg-emerald-100 text-emerald-800', label: 'Usuario aprobado' },
    'task_completed': { color: 'bg-lime-100 text-lime-800', label: 'Tarea completada' },
  };

  const typeInfo = typeMap[tipo] || { color: 'bg-gray-100 text-gray-800', label: tipo };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
      {typeInfo.label}
    </span>
  );
};

// Componente principal del registro de actividad
export default function ActivityLog() {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });
  
  // Handler para DateRange que maneja tipos correctamente
  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    setDateRange({
      from: range.from || undefined,
      to: range.to || undefined,
    });
  };
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedView, setSelectedView] = useState<string>("list");

  // Obtener actividades de usuario
  const {
    data: activities,
    isLoading,
  } = useQuery<UserActivity[]>({
    queryKey: ["/api/activities", {
      from: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '',
      to: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '',
      type: selectedType !== "all" ? selectedType : undefined
    }],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Filtrar actividades según búsqueda
  const filteredActivities = activities?.filter(activity => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return activity.descripcion.toLowerCase().includes(query) || 
           activity.username.toLowerCase().includes(query) ||
           (activity.entidadId && activity.entidadId.toLowerCase().includes(query));
  }) || [];

  // Renderizar vista de carga
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="ml-2 text-muted-foreground">Cargando registro de actividad...</span>
      </div>
    );
  }

  // Función para exportar a CSV
  const exportToCSV = () => {
    if (!activities || activities.length === 0) return;
    
    // Preparar encabezados
    const headers = ['ID', 'Usuario', 'Tipo', 'Descripción', 'Fecha y Hora', 'Entidad ID'];
    
    // Preparar filas de datos
    const rows = activities.map(activity => [
      activity.id,
      activity.username,
      activity.tipo,
      activity.descripcion,
      format(new Date(activity.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es }),
      activity.entidadId || ''
    ]);
    
    // Crear contenido CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Crear y descargar el archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `registro_actividad_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Renderizar contenido principal
  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Registro de Actividad
          </h1>
          <p className="text-muted-foreground">
            Historial detallado de todas las acciones realizadas en el sistema
          </p>
        </div>
        <Button
          onClick={exportToCSV}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download size={16} />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="date-range">Rango de fechas</Label>
          <DatePickerWithRange
            value={dateRange}
            onChange={handleDateRangeChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type-filter">Tipo de actividad</Label>
          <Select
            value={selectedType}
            onValueChange={setSelectedType}
          >
            <SelectTrigger id="type-filter" className="mt-1">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="login">Inicio de sesión</SelectItem>
              <SelectItem value="logout">Cierre de sesión</SelectItem>
              <SelectItem value="budget_create">Creación de presupuesto</SelectItem>
              <SelectItem value="budget_update">Actualización de presupuesto</SelectItem>
              <SelectItem value="budget_finalized">Finalización de presupuesto</SelectItem>
              <SelectItem value="contact_create">Creación de contacto</SelectItem>
              <SelectItem value="contact_update">Actualización de contacto</SelectItem>
              <SelectItem value="import_csv">Importación CSV</SelectItem>
              <SelectItem value="user_update">Actualización de usuario</SelectItem>
              <SelectItem value="user_approve">Aprobación de usuario</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="search">Buscar</Label>
          <div className="relative mt-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Buscar por descripción, usuario o ID..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Vista de actividades */}
      <Tabs value={selectedView} onValueChange={setSelectedView} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="list">
            Vista de Lista
          </TabsTrigger>
          <TabsTrigger value="detail">
            Vista Detallada
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="w-full">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-lg">Listado de Actividades</CardTitle>
              <CardDescription>
                {filteredActivities.length} actividades encontradas
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha y Hora</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="w-full">Descripción</TableHead>
                      <TableHead>ID Entidad</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActivities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No se encontraron actividades con los filtros seleccionados
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredActivities.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell className="whitespace-nowrap">
                            <div className="font-medium">
                              {format(new Date(activity.timestamp), 'dd/MM/yyyy', { locale: es })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(activity.timestamp), 'HH:mm:ss', { locale: es })}
                            </div>
                          </TableCell>
                          <TableCell>
                            {activity.username}
                          </TableCell>
                          <TableCell>
                            {getActivityTypeBadge(activity.tipo)}
                          </TableCell>
                          <TableCell>
                            {activity.descripcion}
                          </TableCell>
                          <TableCell>
                            {activity.entidadId ? (
                              <Badge variant="outline">{activity.entidadId}</Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">N/A</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="detail">
          <div className="space-y-4">
            {filteredActivities.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-32">
                  <p className="text-muted-foreground">No se encontraron actividades con los filtros seleccionados</p>
                </CardContent>
              </Card>
            ) : (
              filteredActivities.map((activity) => (
                <Card key={activity.id}>
                  <CardHeader className="py-4">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {getActivityTypeBadge(activity.tipo)}
                          <span className="font-medium">
                            {activity.username}
                          </span>
                        </CardTitle>
                        <CardDescription>
                          {format(new Date(activity.timestamp), 'dd MMMM yyyy, HH:mm:ss', { locale: es })}
                          {' · '}
                          <span className="text-muted-foreground text-xs">
                            Hace {formatDistanceToNow(new Date(activity.timestamp), { locale: es, addSuffix: false })}
                          </span>
                        </CardDescription>
                      </div>
                      {activity.entidadId && (
                        <Badge variant="outline">ID: {activity.entidadId}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p>{activity.descripcion}</p>
                    <ActivityDetails detalles={activity.detalles} />
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}