export interface BudgetItem {
  codigo: string;
  descripcion: string;
  precio: number;
  cantidad?: number;
}

export interface Budget {
  id: string;
  empresa: string;
  fechaCreacion: string;
  fabricante: string;
  moneda?: string;
  descuento?: number;
  validez?: number;
  items?: BudgetItem[];
  montoTotal: number;
  diasTranscurridos?: number;
  diasRestantes: number;
  tipoSeguimiento: string;
  accion: string;
  prioridad: string;
  alertas: string[];
  completado?: boolean;
  estado?: 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Vencido';
  notas?: string;
  finalizado?: boolean;
  esLicitacion?: boolean;
  contacto?: ContactInfo;
}

export interface ContactInfo {
  nombre: string;
  email?: string;
  telefono?: string;
}

export interface ImportOptions {
  compareWithPrevious: boolean;
  autoFinalizeMissing: boolean;
}

export interface ImportResult {
  added: number;
  updated: number;
  deleted: number;
  total: number;
}

export interface CsvBudgetRow {
  ID: string;
  Empresa: string;
  FechaCreacion: string;
  NroItem: string;
  Cantidad: string;
  Codigo_Producto: string;
  Descripcion: string;
  Fabricante: string;
  NetoItems_USD: string;
  Descuento: string;
  Validez: string;
  Nombre_Contacto?: string;
  Direccion?: string; // Usaremos este campo como email para contacto
}

export interface Stats {
  total: number;
  pending: number;
  expiringSoon: number;
  approved: number;
  rejected: number;
  byManufacturer: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface ReportData {
  type: 'summary' | 'performance' | 'manufacturer' | 'client';
  from: string;
  to: string;
  format: 'excel' | 'pdf' | 'csv';
}

export interface ReportItem {
  title: string;
  format: 'excel' | 'pdf' | 'csv';
  date: string;
  size: string;
}

export interface ActivityItem {
  type: 'import' | 'update' | 'note';
  description: string;
  time: string;
}

export interface TaskFilters {
  priority: 'all' | 'alta' | 'media' | 'baja';
}

export interface BudgetFilters {
  search: string;
  status: 'all' | 'pending' | 'approved' | 'rejected' | 'expired';
}
