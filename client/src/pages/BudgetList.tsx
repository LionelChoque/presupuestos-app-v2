import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Budget, BudgetFilters } from '@/lib/types';
import { filterBudgets, formatCurrency, getStatusColor, getPriorityColor } from '@/lib/utils';
import { Search, RefreshCw } from 'lucide-react';

interface BudgetListProps {
  budgets: Budget[];
  isLoading: boolean;
  onOpenBudgetDetails: (budget: Budget) => void;
}

export default function BudgetList({ budgets, isLoading, onOpenBudgetDetails }: BudgetListProps) {
  const [filters, setFilters] = useState<BudgetFilters>({
    search: '',
    status: 'all'
  });

  const filteredBudgets = filterBudgets(budgets, filters);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Lista de Presupuestos</h1>
      
      <Card>
        <CardHeader className="px-5 py-4 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
          <CardTitle className="text-lg font-medium text-gray-900">Presupuestos</CardTitle>
          <div className="mt-3 sm:mt-0 sm:flex sm:items-center sm:space-x-4">
            <div className="relative rounded-md shadow-sm">
              <Input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="block w-full pr-10 sm:text-sm"
                placeholder="Buscar presupuesto..."
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value as BudgetFilters['status'] })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="approved">Aprobados</SelectItem>
                <SelectItem value="rejected">Rechazados</SelectItem>
                <SelectItem value="expired">Vencidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fabricante
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto (USD)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Días Rest.
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <RefreshCw className="animate-spin h-5 w-5 mr-2 text-primary" />
                        <span>Cargando...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredBudgets.length > 0 ? (
                  filteredBudgets.map((budget) => (
                    <tr 
                      key={budget.id} 
                      className={budget.prioridad === 'Alta' && !budget.completado ? 'bg-yellow-50' : ''}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <span>{budget.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span>{budget.empresa}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span>{budget.fechaCreacion}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span>{budget.fabricante}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        <span>{formatCurrency(budget.montoTotal)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(budget.tipoSeguimiento)}>
                          {budget.tipoSeguimiento}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`
                          ${budget.diasRestantes <= 0 ? 'text-red-600 font-medium' : 
                          budget.diasRestantes <= 7 ? 'text-yellow-600 font-medium' : 
                          'text-gray-900'}
                        `}>
                          {budget.diasRestantes}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getPriorityColor(budget.prioridad)}>
                          {budget.prioridad}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button 
                          variant="link" 
                          onClick={() => onOpenBudgetDetails(budget)}
                          className="text-primary hover:text-primary-900"
                        >
                          Ver detalles
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                      No se encontraron presupuestos que coincidan con los filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{filteredBudgets.length}</span> de <span className="font-medium">{budgets.length}</span> presupuestos
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
