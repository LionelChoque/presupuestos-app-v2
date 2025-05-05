import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Budget, 
  ContactInfo, 
  ImportOptions, 
  ImportResult, 
  BudgetStageHistoryItem,
  BudgetActionHistoryItem 
} from '@/lib/types';
import { processImportedCsv } from '@/lib/csvParser';
import { useToast } from '@/hooks/use-toast';

export function useBudgets() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBudgetDetailsOpen, setIsBudgetDetailsOpen] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [actionStatus, setActionStatus] = useState<Record<string, boolean>>({});
  const [contactsData, setContactsData] = useState<Record<string, ContactInfo>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    compareWithPrevious: true,
    autoFinalizeMissing: true
  });

  // Fetch budgets from API
  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['/api/budgets'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch contacts from API
  const { data: contacts = [] } = useQuery({
    queryKey: ['/api/contacts'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    // Convert contacts array to record for easy lookup
    const contactsRecord: Record<string, ContactInfo> = {};
    contacts.forEach((contact: ContactInfo & { budgetId: string }) => {
      contactsRecord[contact.budgetId] = {
        nombre: contact.nombre,
        email: contact.email,
        telefono: contact.telefono
      };
    });
    setContactsData(contactsRecord);
  }, [contacts]);

  // Update budget mutation
  const updateBudgetMutation = useMutation({
    mutationFn: async (budget: Budget) => {
      const res = await apiRequest('PATCH', `/api/budgets/${budget.id}`, budget);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budgets'] });
    }
  });

  // Save contact info mutation
  const saveContactMutation = useMutation({
    mutationFn: async ({ budgetId, data }: { budgetId: string, data: ContactInfo }) => {
      const res = await apiRequest('POST', `/api/contacts`, { budgetId, ...data });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
    }
  });

  // Upload CSV mutation
  const uploadCsvMutation = useMutation({
    mutationFn: async ({ csvData, options }: { csvData: string, options: ImportOptions }) => {
      const res = await apiRequest('POST', '/api/import', { csvData, options });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budgets'] });
      setIsImportModalOpen(false);
      setSelectedFile(null);
      setUploadProgress(0);
    }
  });

  // Import CSV file
  const importCsvFile = async () => {
    if (!selectedFile) return;

    try {
      setUploadProgress(10);
      const csvData = await readFileAsText(selectedFile);
      setUploadProgress(30);
      
      // Process locally first to get the result
      const { result } = await processImportedCsv(csvData, budgets, importOptions);
      setUploadProgress(60);
      
      // Send to the server
      await uploadCsvMutation.mutateAsync({ csvData, options: importOptions });
      
      setUploadProgress(100);
      
      toast({
        title: 'Importación exitosa',
        description: `Se importaron ${result.added} presupuestos nuevos, se actualizaron ${result.updated} y se finalizaron ${result.deleted}.`,
      });
      
    } catch (error) {
      toast({
        title: 'Error al importar',
        description: 'Ocurrió un error al importar el archivo CSV.',
        variant: 'destructive'
      });
      console.error(error);
    }
  };

  // Read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Error reading file'));
        }
      };
      reader.onerror = () => {
        reject(reader.error);
      };
      reader.readAsText(file);
    });
  };

  // Toggle task completion
  const toggleTask = (id: string) => {
    setCompletedTasks(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Save notes for a budget
  const saveNotes = async (budgetId: string, notes: string) => {
    if (!budgetId) return;
    
    setNotes(prev => ({
      ...prev,
      [budgetId]: notes
    }));
    
    const budgetToUpdate = budgets.find((b: Budget) => b.id === budgetId);
    if (budgetToUpdate) {
      await updateBudgetMutation.mutateAsync({
        ...budgetToUpdate,
        notas: notes
      });
      
      toast({
        title: 'Notas guardadas',
        description: 'Las notas se han guardado correctamente.'
      });
    }
  };

  // Mark action as completed
  const markActionCompleted = async (budgetId: string) => {
    if (!budgetId) return;
    
    const newStatus = !actionStatus[budgetId];
    
    setActionStatus(prev => ({
      ...prev,
      [budgetId]: newStatus
    }));
    
    const budgetToUpdate = budgets.find((b: Budget) => b.id === budgetId);
    if (budgetToUpdate) {
      // Crear nuevo item de historial para la acción
      const newAction: BudgetActionHistoryItem = {
        accion: newStatus ? 'Acción completada' : 'Acción reabierta',
        fecha: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
        comentario: newStatus ? `Se completó la acción "${budgetToUpdate.accion}"` : `Se reabrió la acción "${budgetToUpdate.accion}"`
      };
      
      // Añadir al historial existente o crear un nuevo array
      const updatedActionHistory = [
        ...(budgetToUpdate.historialAcciones || []),
        newAction
      ];
      
      await updateBudgetMutation.mutateAsync({
        ...budgetToUpdate,
        completado: newStatus,
        fechaCompletado: newStatus ? new Date().toISOString().split('T')[0] : undefined,
        historialAcciones: updatedActionHistory
      });
    }
  };

  // Save contact info
  const saveContactInfo = async (budgetId: string, data: ContactInfo) => {
    if (!budgetId) return;
    
    setContactsData(prev => ({
      ...prev,
      [budgetId]: data
    }));
    
    await saveContactMutation.mutateAsync({ budgetId, data });
    
    toast({
      title: 'Contacto guardado',
      description: 'La información de contacto se ha guardado correctamente.'
    });
  };

  // Finalize budget (approve or reject)
  const finalizeBudget = async (budgetId: string, status: 'Aprobado' | 'Rechazado') => {
    if (!budgetId) return;
    
    const budgetToUpdate = budgets.find((b: Budget) => b.id === budgetId);
    if (budgetToUpdate) {
      const currentDate = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
      
      // Crear nuevo item de historial para la acción de finalización
      const newAction: BudgetActionHistoryItem = {
        accion: `Presupuesto ${status}`,
        fecha: currentDate,
        comentario: `El presupuesto ha sido ${status === 'Aprobado' ? 'aprobado' : 'rechazado'}`
      };
      
      // Añadir al historial existente o crear un nuevo array
      const updatedActionHistory = [
        ...(budgetToUpdate.historialAcciones || []),
        newAction
      ];
      
      await updateBudgetMutation.mutateAsync({
        ...budgetToUpdate,
        estado: status,
        fechaEstado: currentDate,
        finalizado: true,
        fechaFinalizado: currentDate,
        historialAcciones: updatedActionHistory
      });
      
      setIsBudgetDetailsOpen(false);
      
      toast({
        title: 'Presupuesto finalizado',
        description: `El presupuesto ha sido marcado como ${status}.`
      });
    }
  };

  // Change budget type
  const changeBudgetType = async (budgetId: string, isLicitacion: boolean) => {
    if (!budgetId) return;
    
    const budgetToUpdate = budgets.find((b: Budget) => b.id === budgetId);
    if (budgetToUpdate) {
      await updateBudgetMutation.mutateAsync({
        ...budgetToUpdate,
        esLicitacion: isLicitacion
      });
      
      toast({
        title: 'Tipo de presupuesto actualizado',
        description: `El presupuesto ha sido marcado como ${isLicitacion ? 'Licitación' : 'Presupuesto Estándar'}.`
      });
    }
  };
  
  // Add a new stage to the budget history
  const advanceBudgetStage = async (budgetId: string, newStage: string, commentText?: string) => {
    if (!budgetId) return;
    
    const budgetToUpdate = budgets.find((b: Budget) => b.id === budgetId);
    if (budgetToUpdate) {
      // Create new history item
      const newHistoryItem: BudgetStageHistoryItem = {
        etapa: newStage,
        fecha: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
        comentario: commentText
      };
      
      // Add to existing history or create new array
      const updatedHistory = [
        ...(budgetToUpdate.historialEtapas || []),
        newHistoryItem
      ];
      
      await updateBudgetMutation.mutateAsync({
        ...budgetToUpdate,
        historialEtapas: updatedHistory,
        tipoSeguimiento: newStage // Also update the current stage
      });
      
      toast({
        title: 'Etapa actualizada',
        description: `El presupuesto ha avanzado a la etapa "${newStage}".`
      });
    }
  };
  
  // Open budget details modal
  const openBudgetDetails = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsBudgetDetailsOpen(true);
  };

  return {
    budgets,
    isLoading,
    selectedBudget,
    isImportModalOpen,
    isBudgetDetailsOpen,
    completedTasks,
    notes,
    actionStatus,
    contactsData,
    selectedFile,
    uploadProgress,
    importOptions,
    setSelectedBudget,
    setIsImportModalOpen,
    setIsBudgetDetailsOpen,
    setSelectedFile,
    setUploadProgress,
    setImportOptions,
    toggleTask,
    saveNotes,
    markActionCompleted,
    saveContactInfo,
    finalizeBudget,
    openBudgetDetails,
    importCsvFile,
    changeBudgetType,
    advanceBudgetStage
  };
}
