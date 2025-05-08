import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";
import { addDays, format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, UserCheck, Clock, Target, BarChart4, TrendingUp } from "lucide-react";
import { Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Tipos para datos de análisis de rendimiento
interface UserPerformanceData {
  userId: number;
  username: string;
  nombre?: string;
  apellido?: string;
  totalActions: number;
  completedTasks: number;
  pendingTasks: number;
  averageResponseTime: number; // en horas
  lastActive: string;
  successRate: number; // porcentaje de tareas completadas vs. abandonadas
  activityByDay: {
    date: string;
    count: number;
  }[];
  activityByType: {
    type: string;
    count: number;
  }[];
  topBudgets: {
    budgetId: string;
    empresa: string;
    actionsCount: number;
  }[];
}

// Datos consolidados para la vista general
interface PerformanceOverviewData {
  mostActiveUser: {
    userId: number;
    username: string;
    actionCount: number;
  };
  leastActiveUser: {
    userId: number;
    username: string;
    actionCount: number;
  };
  fastestResponseTime: {
    userId: number;
    username: string;
    responseTime: number; // en horas
  };
  highestSuccessRate: {
    userId: number;
    username: string;
    rate: number; // porcentaje
  };
  totalActionsByDay: {
    date: string;
    count: number;
  }[];
  totalActionsByType: {
    type: string;
    count: number;
  }[];
  userComparisonData: {
    username: string;
    actions: number;
    tasks: number;
    responseTime: number;
  }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// Componente principal de análisis de rendimiento
export default function UserPerformance() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  
  // Handler para DateRange que maneja tipos correctamente
  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };
  const [selectedUser, setSelectedUser] = useState<string>("all");

  // Cargar datos de usuarios
  const {
    data: users,
    isLoading: isLoadingUsers,
  } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Cargar datos de rendimiento
  const {
    data: performanceData,
    isLoading: isLoadingPerformance,
  } = useQuery<{ users: UserPerformanceData[], overview: PerformanceOverviewData }>({
    queryKey: ["/api/admin/performance", {
      from: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '',
      to: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '',
      userId: selectedUser !== "all" ? selectedUser : undefined
    }],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const isLoading = isLoadingUsers || isLoadingPerformance;

  // Renderizar vista de carga
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="ml-2 text-muted-foreground">Cargando datos de rendimiento...</span>
      </div>
    );
  }

  // Renderizar contenido principal
  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Análisis de Desempeño
          </h1>
          <p className="text-muted-foreground">
            Métricas detalladas del rendimiento de los usuarios del sistema
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <Label htmlFor="date-range">Rango de Fechas</Label>
          <DatePickerWithRange 
            className="mt-1" 
            value={dateRange}
            onChange={handleDateRangeChange}
          />
        </div>
        <div>
          <Label htmlFor="user-filter">Usuario</Label>
          <Select
            value={selectedUser}
            onValueChange={setSelectedUser}
          >
            <SelectTrigger id="user-filter" className="mt-1">
              <SelectValue placeholder="Seleccionar usuario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los usuarios</SelectItem>
              {users && Array.isArray(users) && users.map((user: any) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.nombre && user.apellido 
                    ? `${user.nombre} ${user.apellido} (${user.username})`
                    : user.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Análisis de rendimiento */}
      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="comparison">Comparativa</TabsTrigger>
          <TabsTrigger value="individual">Análisis Individual</TabsTrigger>
          <TabsTrigger value="activityLog">Registro de Actividad</TabsTrigger>
        </TabsList>
        
        {/* Vista general */}
        <TabsContent value="overview">
          {performanceData && (
            <>
              {/* KPIs principales */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Usuario más activo</CardTitle>
                      <UserCheck className="h-5 w-5 text-blue-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {performanceData.overview.mostActiveUser.username}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {performanceData.overview.mostActiveUser.actionCount} acciones
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Tiempo de respuesta más rápido</CardTitle>
                      <Clock className="h-5 w-5 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {performanceData.overview.fastestResponseTime.username}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {performanceData.overview.fastestResponseTime.responseTime.toFixed(1)} horas
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Mayor tasa de éxito</CardTitle>
                      <Target className="h-5 w-5 text-purple-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {performanceData.overview.highestSuccessRate.username}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {performanceData.overview.highestSuccessRate.rate.toFixed(1)}% completado
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Usuario menos activo</CardTitle>
                      <Calendar className="h-5 w-5 text-orange-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {performanceData.overview.leastActiveUser.username}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {performanceData.overview.leastActiveUser.actionCount} acciones
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Gráficos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Actividad diaria</CardTitle>
                    <CardDescription>
                      Acciones totales por día en el período seleccionado
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={performanceData.overview.totalActionsByDay}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return format(date, 'dd/MM');
                          }}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: any) => [value, 'Acciones']}
                          labelFormatter={(label) => {
                            const date = new Date(label);
                            return format(date, 'dd MMM yyyy', { locale: es });
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#8884d8" 
                          activeDot={{ r: 8 }} 
                          name="Acciones"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución por tipo de actividad</CardTitle>
                    <CardDescription>
                      Porcentaje de acciones por categoría
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={performanceData.overview.totalActionsByType}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="type"
                        >
                          {performanceData.overview.totalActionsByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [value, 'Acciones']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
        
        {/* Comparativa de usuarios */}
        <TabsContent value="comparison">
          {performanceData && (
            <Card>
              <CardHeader>
                <CardTitle>Comparativa de usuarios</CardTitle>
                <CardDescription>
                  Análisis comparativo del rendimiento de todos los usuarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead className="text-right">Acciones totales</TableHead>
                      <TableHead className="text-right">Tareas completadas</TableHead>
                      <TableHead className="text-right">Tiempo medio respuesta</TableHead>
                      <TableHead className="text-right">Tasa de éxito</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performanceData.users.map((user) => (
                      <TableRow key={user.userId}>
                        <TableCell className="font-medium">
                          {user.nombre && user.apellido 
                            ? `${user.nombre} ${user.apellido}`
                            : user.username}
                        </TableCell>
                        <TableCell className="text-right">{user.totalActions}</TableCell>
                        <TableCell className="text-right">
                          {user.completedTasks} / {user.completedTasks + user.pendingTasks}
                        </TableCell>
                        <TableCell className="text-right">
                          {user.averageResponseTime.toFixed(2)} horas
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={user.successRate > 75 ? "success" : user.successRate > 40 ? "warning" : "destructive"}>
                            {user.successRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Análisis individual */}
        <TabsContent value="individual">
          {performanceData && selectedUser !== "all" ? (
            // Mostrar detalles del usuario seleccionado
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Resumen</CardTitle>
                    <CardDescription>
                      Métricas clave de rendimiento
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {performanceData.users
                      .filter(u => u.userId.toString() === selectedUser)
                      .map(user => (
                        <div key={user.userId} className="space-y-4">
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">Nombre</div>
                            <div className="font-medium">
                              {user.nombre && user.apellido 
                                ? `${user.nombre} ${user.apellido}`
                                : user.username}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">Última actividad</div>
                            <div className="font-medium">
                              {formatDistanceToNow(new Date(user.lastActive), { addSuffix: true, locale: es })}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="text-sm text-muted-foreground">Acciones</div>
                              <div className="text-2xl font-bold">{user.totalActions}</div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="text-sm text-muted-foreground">Tareas completadas</div>
                              <div className="text-2xl font-bold">{user.completedTasks}</div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="text-sm text-muted-foreground">Tareas pendientes</div>
                              <div className="text-2xl font-bold">{user.pendingTasks}</div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="text-sm text-muted-foreground">Tasa de éxito</div>
                              <div className="text-2xl font-bold">{user.successRate.toFixed(1)}%</div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-2">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Actividad por día</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    {performanceData.users
                      .filter(u => u.userId.toString() === selectedUser)
                      .map(user => (
                        <ResponsiveContainer key={user.userId} width="100%" height="100%">
                          <LineChart
                            data={user.activityByDay}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={(value) => {
                                const date = new Date(value);
                                return format(date, 'dd/MM');
                              }}
                            />
                            <YAxis />
                            <Tooltip 
                              formatter={(value: any) => [value, 'Acciones']}
                              labelFormatter={(label) => {
                                const date = new Date(label);
                                return format(date, 'dd MMM yyyy', { locale: es });
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="count" 
                              stroke="#8884d8" 
                              activeDot={{ r: 8 }} 
                              name="Acciones"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ))}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Presupuestos más trabajados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {performanceData.users
                      .filter(u => u.userId.toString() === selectedUser)
                      .map(user => (
                        <Table key={user.userId}>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Empresa</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {user.topBudgets.map(budget => (
                              <TableRow key={budget.budgetId}>
                                <TableCell className="font-mono text-xs">{budget.budgetId}</TableCell>
                                <TableCell>{budget.empresa}</TableCell>
                                <TableCell className="text-right">{budget.actionsCount}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart4 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Selecciona un usuario</h3>
              <p className="text-muted-foreground">
                Escoge un usuario específico para ver un análisis detallado de su rendimiento.
              </p>
            </div>
          )}
        </TabsContent>
        
        {/* Registro de actividad */}
        <TabsContent value="activityLog">
          <Card>
            <CardHeader>
              <CardTitle>Registro de actividad detallado</CardTitle>
              <CardDescription>
                Historial cronológico de acciones realizadas por los usuarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Implementación de tabla con paginación y filtrado avanzado de actividades */}
              <p className="text-muted-foreground text-center py-8">
                Esta funcionalidad estará disponible en la próxima actualización.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}