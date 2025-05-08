import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReportData, ReportItem } from '@/lib/types';
import { DownloadCloud, FileText, File, FileSpreadsheet, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function Reports() {
  const { toast } = useToast();
  const [reportData, setReportData] = useState<ReportData>({
    type: 'summary',
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
    format: 'excel'
  });

  // Tipo para los reportes de la API
  interface ApiReport {
    id: number;
    titulo: string;
    tipo: string;
    fechaGeneracion: string;
    formato: string;
    tamano: string;
    rutaArchivo: string;
    usuarioId: number;
  }

  // Obtener los reportes generados
  const { data: reports, isLoading, isError } = useQuery<ApiReport[]>({
    queryKey: ['/api/reports'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Mutación para generar un nuevo reporte
  const generateReportMutation = useMutation<ApiReport, Error, ReportData>({
    mutationFn: async (data: ReportData) => {
      const response = await apiRequest('POST', '/api/reports/generate', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reporte generado con éxito",
        description: "El reporte ha sido generado y guardado para su descarga.",
      });
      // Invalidar la consulta de forma explícita y forzar una recarga
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      // Refrescar la página después de un breve retraso para asegurar que se actualice la UI
      setTimeout(() => {
        window.location.reload();
      }, 500);
    },
    onError: (error) => {
      toast({
        title: "Error al generar el reporte",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutación para descargar un reporte
  const downloadReportMutation = useMutation<Blob, Error, number>({
    mutationFn: async (reportId: number) => {
      const response = await apiRequest('GET', `/api/reports/${reportId}/download`);
      return await response.blob();
    },
    onSuccess: (blob, reportId) => {
      if (!reports) return;
      
      const report = reports.find((r) => r.id === reportId);
      if (report) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = report.titulo.replace(/\s+/g, '_') + '.' + report.formato;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    },
    onError: (error) => {
      toast({
        title: "Error al descargar el reporte",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const generateReport = () => {
    generateReportMutation.mutate(reportData);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Reportes</h1>
      
      {/* Generate Report Form */}
      <Card>
        <CardHeader className="px-5 py-4 border-b border-gray-200">
          <CardTitle className="text-lg font-medium text-gray-900">Generar Reportes</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <form className="space-y-6">
            <div>
              <Label htmlFor="report-type">Tipo de Reporte</Label>
              <Select
                value={reportData.type}
                onValueChange={(value) => setReportData({ ...reportData, type: value as ReportData['type'] })}
              >
                <SelectTrigger id="report-type" className="w-full mt-1">
                  <SelectValue placeholder="Seleccionar tipo de reporte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Resumen General</SelectItem>
                  <SelectItem value="performance">Desempeño de Presupuestos</SelectItem>
                  <SelectItem value="manufacturer">Análisis por Fabricante</SelectItem>
                  <SelectItem value="client">Análisis por Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Período</Label>
              <div className="mt-1 grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="report-date-from" className="block text-xs text-gray-500">Desde</Label>
                  <Input
                    type="date"
                    id="report-date-from"
                    value={reportData.from}
                    onChange={(e) => setReportData({ ...reportData, from: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="report-date-to" className="block text-xs text-gray-500">Hasta</Label>
                  <Input
                    type="date"
                    id="report-date-to"
                    value={reportData.to}
                    onChange={(e) => setReportData({ ...reportData, to: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="report-format">Formato de Salida</Label>
              <Select
                value={reportData.format}
                onValueChange={(value) => setReportData({ ...reportData, format: value as ReportData['format'] })}
              >
                <SelectTrigger id="report-format" className="w-full mt-1">
                  <SelectValue placeholder="Seleccionar formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={generateReport}
                className="inline-flex items-center"
              >
                <DownloadCloud className="h-5 w-5 mr-2" />
                Generar Reporte
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Recent Reports */}
      <Card>
        <CardHeader className="px-5 py-4 border-b border-gray-200">
          <CardTitle className="text-lg font-medium text-gray-900">Reportes Recientes</CardTitle>
          <CardDescription>
            Reportes generados previamente que pueden descargarse
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
              <span>Cargando reportes...</span>
            </div>
          ) : isError ? (
            <div className="p-6 text-center text-red-500">
              Error al cargar los reportes. Por favor, inténtelo de nuevo.
            </div>
          ) : !reports || reports.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No hay reportes generados. Utilice el formulario superior para crear su primer reporte.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {reports.map((report) => (
                <li key={report.id} className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`
                      flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center
                      ${report.formato === 'xlsx' || report.formato === 'excel' ? 'bg-green-100' : 
                      report.formato === 'pdf' ? 'bg-red-100' : 'bg-blue-100'}
                    `}>
                      {(report.formato === 'xlsx' || report.formato === 'excel') && 
                        <FileSpreadsheet className="h-4 w-4 text-green-700" />}
                      {report.formato === 'pdf' && <File className="h-4 w-4 text-red-700" />}
                      {report.formato === 'csv' && <FileText className="h-4 w-4 text-blue-700" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{report.titulo}</p>
                      <p className="text-sm text-gray-500">
                        <span>
                          {format(new Date(report.fechaGeneracion), 'dd/MM/yyyy', { locale: es })}
                        </span> · <span>{report.tamano}</span>
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary-900 text-sm font-medium flex items-center space-x-1"
                    onClick={() => downloadReportMutation.mutate(report.id)}
                    disabled={downloadReportMutation.isPending}
                  >
                    {downloadReportMutation.isPending && downloadReportMutation.variables === report.id ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <DownloadCloud className="h-4 w-4 mr-1" />
                    )}
                    <span>Descargar</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
