import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertCircle,
  BarChart,
  CheckCircle,
  Clock,
  FileText,
  Upload,
  RefreshCw
} from 'lucide-react';
import { Budget, Stats, ActivityItem } from '@/lib/types';
import { calculateStats } from '@/lib/utils';
import { Chart } from 'chart.js/auto';

interface DashboardProps {
  budgets: Budget[];
  isLoading: boolean;
}

export default function Dashboard({ budgets, isLoading }: DashboardProps) {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    expiringSoon: 0,
    approved: 0,
    rejected: 0,
    byManufacturer: {},
    byStatus: {}
  });
  
  const statusChartRef = useRef<HTMLCanvasElement>(null);
  const manufacturerChartRef = useRef<HTMLCanvasElement>(null);
  const statusChartInstance = useRef<Chart<'doughnut'> | null>(null);
  const manufacturerChartInstance = useRef<Chart<'bar'> | null>(null);

  // Mock recent activity
  const recentActivity: ActivityItem[] = [
    { type: 'import', description: 'Importación de presupuestos (84 presupuestos)', time: '2 minutos atrás' },
    { type: 'update', description: 'Se marcó el presupuesto #39120 como Rechazado', time: '15 minutos atrás' },
    { type: 'update', description: 'Se marcó el presupuesto #39118 como Aprobado', time: '45 minutos atrás' },
    { type: 'note', description: 'Nota añadida al presupuesto #39097', time: '1 hora atrás' },
    { type: 'import', description: 'Importación de presupuestos (76 presupuestos)', time: '1 día atrás' }
  ];

  useEffect(() => {
    if (!isLoading && budgets.length > 0) {
      setStats(calculateStats(budgets));
    }
  }, [budgets, isLoading]);

  useEffect(() => {
    // Initialize the charts when stats are available
    if (stats.total > 0) {
      initCharts();
    }
    
    return () => {
      // Clean up chart instances on unmount
      if (statusChartInstance.current) {
        statusChartInstance.current.destroy();
      }
      if (manufacturerChartInstance.current) {
        manufacturerChartInstance.current.destroy();
      }
    };
  }, [stats]);

  const initCharts = () => {
    const statusLabels = ['Confirmación', 'Primer Seguimiento', 'Seguimiento Final', 'Vencido', 'Aprobado', 'Rechazado'];
    const statusData = statusLabels.map(label => stats.byStatus[label] || 0);
    
    // Get top 5 manufacturers
    const manufacturerEntries = Object.entries(stats.byManufacturer)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const manufacturerLabels = manufacturerEntries.map(([label]) => label);
    const manufacturerData = manufacturerEntries.map(([, value]) => value);

    if (statusChartRef.current) {
      if (statusChartInstance.current) {
        statusChartInstance.current.destroy();
      }
      
      statusChartInstance.current = new Chart(statusChartRef.current, {
        type: 'doughnut',
        data: {
          labels: statusLabels,
          datasets: [{
            data: statusData,
            backgroundColor: ['#93C5FD', '#A78BFA', '#FBBF24', '#9CA3AF', '#34D399', '#F87171']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
            }
          }
        }
      });
    }

    if (manufacturerChartRef.current) {
      if (manufacturerChartInstance.current) {
        manufacturerChartInstance.current.destroy();
      }
      
      manufacturerChartInstance.current = new Chart(manufacturerChartRef.current, {
        type: 'bar',
        data: {
          labels: manufacturerLabels,
          datasets: [{
            label: 'Presupuestos',
            data: manufacturerData,
            backgroundColor: '#3B82F6',
            borderColor: '#2563EB',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0 // Show only integers
              }
            }
          }
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <span className="ml-2 text-lg">Cargando datos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="stat-card-icon bg-primary-100">
                <FileText className="h-6 w-6 text-primary-700" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Presupuestos
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="stat-card-value">{stats.total}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="stat-card-icon bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-700" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pendientes
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="stat-card-value">{stats.pending}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="stat-card-icon bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-700" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Por Vencer (7 días)
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="stat-card-value">{stats.expiringSoon}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="stat-card-icon bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-700" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Aprobados (Este mes)
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="stat-card-value">{stats.approved}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Estado de Presupuestos</h3>
            <div className="mt-2 h-64">
              <canvas ref={statusChartRef}></canvas>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Presupuestos por Fabricante</h3>
            <div className="mt-2 h-64">
              <canvas ref={manufacturerChartRef}></canvas>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Actividad Reciente</h3>
        </div>
        <div className="overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {recentActivity.map((activity, i) => (
              <li key={i} className="px-5 py-4">
                <div className="flex items-center space-x-4">
                  <div className={`
                    flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center
                    ${activity.type === 'import' ? 'bg-blue-100' : activity.type === 'update' ? 'bg-green-100' : 'bg-yellow-100'}
                  `}>
                    {activity.type === 'import' && <Upload className="h-4 w-4 text-blue-700" />}
                    {activity.type === 'update' && <RefreshCw className="h-4 w-4 text-green-700" />}
                    {activity.type === 'note' && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}
