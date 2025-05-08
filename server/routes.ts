import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from 'zod';
import { insertContactInfoSchema, insertBudgetSchema } from '@shared/schema';
import { readFileSync } from 'fs';
import path from 'path';
import { setupAuth, isAuthenticated, isAdmin, logUserActivity } from './auth';

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar autenticación
  setupAuth(app);
  // Get all budgets
  app.get('/api/budgets', async (req, res) => {
    try {
      const budgets = await storage.getAllBudgets();
      res.json(budgets);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      res.status(500).json({ message: 'Failed to fetch budgets' });
    }
  });

  // Get a specific budget
  app.get('/api/budgets/:id', async (req, res) => {
    try {
      const budget = await storage.getBudget(req.params.id);
      if (!budget) {
        return res.status(404).json({ message: 'Budget not found' });
      }
      res.json(budget);
    } catch (error) {
      console.error('Error fetching budget:', error);
      res.status(500).json({ message: 'Failed to fetch budget' });
    }
  });

  // Get budget items for a specific budget
  app.get('/api/budgets/:id/items', async (req, res) => {
    try {
      const items = await storage.getBudgetItems(req.params.id);
      res.json(items);
    } catch (error) {
      console.error('Error fetching budget items:', error);
      res.status(500).json({ message: 'Failed to fetch budget items' });
    }
  });

  // Update a budget
  app.patch('/api/budgets/:id', isAuthenticated, async (req, res) => {
    try {
      const updateSchema = insertBudgetSchema.partial();
      const validatedData = updateSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: 'Invalid budget data', 
          errors: validatedData.error.format() 
        });
      }
      
      const updatedBudget = await storage.updateBudget(req.params.id, validatedData.data);
      if (!updatedBudget) {
        return res.status(404).json({ message: 'Budget not found' });
      }
      
      // Registrar la actividad
      if (req.user) {
        await logUserActivity(
          req.user.id, 
          "budget_update", 
          `Usuario ${req.user.username} actualizó el presupuesto ${updatedBudget.id}`,
          updatedBudget.id,
          { ...validatedData.data }
        );
      }
      
      res.json(updatedBudget);
    } catch (error) {
      console.error('Error updating budget:', error);
      res.status(500).json({ message: 'Failed to update budget' });
    }
  });

  // Get all contacts
  app.get('/api/contacts', async (req, res) => {
    try {
      const contacts = await storage.getAllContacts();
      res.json(contacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ message: 'Failed to fetch contacts' });
    }
  });

  // Get contact for a specific budget
  app.get('/api/contacts/:budgetId', async (req, res) => {
    try {
      const contact = await storage.getContact(req.params.budgetId);
      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }
      res.json(contact);
    } catch (error) {
      console.error('Error fetching contact:', error);
      res.status(500).json({ message: 'Failed to fetch contact' });
    }
  });

  // Create or update contact for a budget
  app.post('/api/contacts', isAuthenticated, async (req, res) => {
    try {
      const contactSchema = z.object({
        budgetId: z.string(),
        nombre: z.string(),
        email: z.string().email().optional(),
        telefono: z.string().optional(),
      });
      
      const validatedData = contactSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: 'Invalid contact data', 
          errors: validatedData.error.format() 
        });
      }
      
      const { budgetId, ...contactData } = validatedData.data;
      
      const existingContact = await storage.getContact(budgetId);
      let contact;
      
      if (existingContact) {
        contact = await storage.updateContact(budgetId, contactData);
        
        // Registrar la actividad de actualización
        if (req.user) {
          await logUserActivity(
            req.user.id, 
            "contact_update", 
            `Usuario ${req.user.username} actualizó el contacto para el presupuesto ${budgetId}`,
            budgetId,
            contactData
          );
        }
      } else {
        contact = await storage.createContact(budgetId, contactData);
        
        // Registrar la actividad de creación
        if (req.user) {
          await logUserActivity(
            req.user.id, 
            "contact_create", 
            `Usuario ${req.user.username} creó el contacto para el presupuesto ${budgetId}`,
            budgetId,
            contactData
          );
        }
      }
      
      res.json(contact);
    } catch (error) {
      console.error('Error creating/updating contact:', error);
      res.status(500).json({ message: 'Failed to create/update contact' });
    }
  });

  // Import CSV data
  app.post('/api/import', isAuthenticated, async (req, res) => {
    try {
      const importSchema = z.object({
        csvData: z.string(),
        options: z.object({
          compareWithPrevious: z.boolean(),
          autoFinalizeMissing: z.boolean(),
        }),
      });
      
      const validatedData = importSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: 'Invalid import data', 
          errors: validatedData.error.format() 
        });
      }
      
      const { csvData, options } = validatedData.data;
      
      // Process CSV data and save to storage
      const result = await storage.importCsvData(csvData, options);
      
      // Log the import
      await storage.createImportLog({
        fileName: 'manual_import.csv',
        recordsImported: result.added,
        recordsUpdated: result.updated,
        recordsDeleted: result.deleted,
      });
      
      // Registrar la actividad
      if (req.user) {
        await logUserActivity(
          req.user.id, 
          "import_csv", 
          `Usuario ${req.user.username} importó CSV con ${result.added} nuevos, ${result.updated} actualizados, ${result.deleted} eliminados`,
          "manual_csv",
          { ...options, totalRecords: result.total }
        );
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error importing CSV:', error);
      res.status(500).json({ message: 'Failed to import CSV data' });
    }
  });

  // Get import logs
  app.get('/api/import-logs', isAuthenticated, async (req, res) => {
    try {
      const logs = await storage.getImportLogs();
      res.json(logs);
    } catch (error) {
      console.error('Error fetching import logs:', error);
      res.status(500).json({ message: 'Failed to fetch import logs' });
    }
  });
  
  // Rutas para administración de usuarios
  
  // Obtener todos los usuarios (solo admin)
  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Eliminar contraseñas antes de enviar
      const usersWithoutPasswords = users.map(user => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      res.status(500).json({ message: 'Error al obtener usuarios' });
    }
  });
  
  // Obtener estadísticas de usuarios (solo admin)
  app.get('/api/admin/users/stats', isAdmin, async (req, res) => {
    try {
      const stats = await storage.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error('Error obteniendo estadísticas de usuarios:', error);
      res.status(500).json({ message: 'Error al obtener estadísticas de usuarios' });
    }
  });
  
  // Obtener registro de actividades (solo admin)
  app.get('/api/activities', isAdmin, async (req, res) => {
    try {
      console.log('Procesando solicitud de actividades');
      // Obtener parámetros de filtrado
      const fromDate = req.query.from ? new Date(req.query.from as string) : undefined;
      const toDate = req.query.to ? new Date(req.query.to as string) : undefined;
      const tipo = req.query.type as string | undefined;
      
      // Validar parámetros
      if (fromDate && isNaN(fromDate.getTime())) {
        return res.status(400).json({ message: 'Fecha inicial inválida' });
      }
      if (toDate && isNaN(toDate.getTime())) {
        return res.status(400).json({ message: 'Fecha final inválida' });
      }
      
      console.log(`Filtros: desde=${fromDate?.toISOString()}, hasta=${toDate?.toISOString()}, tipo=${tipo || 'todos'}`);
      
      // Obtener actividades (máximo 1000 para no sobrecargar)
      const activities = await storage.getUserActivities(1000, 0);
      
      // Filtrar actividades por fecha y tipo si es necesario
      const filteredActivities = activities.filter(activity => {
        const activityDate = activity.timestamp ? new Date(activity.timestamp) : new Date();
        
        let includeActivity = true;
        
        if (fromDate) {
          includeActivity = includeActivity && activityDate >= fromDate;
        }
        
        if (toDate) {
          const endOfDay = new Date(toDate);
          endOfDay.setHours(23, 59, 59, 999);
          includeActivity = includeActivity && activityDate <= endOfDay;
        }
        
        if (tipo && tipo !== 'all') {
          includeActivity = includeActivity && activity.tipo === tipo;
        }
        
        return includeActivity;
      });
      
      console.log(`Total de actividades filtradas: ${filteredActivities.length}`);
      
      res.json(filteredActivities);
    } catch (error) {
      console.error('Error obteniendo actividades:', error);
      res.status(500).json({ message: 'Error al obtener actividades' });
    }
  });
  
  // Obtener datos de rendimiento de usuarios (solo admin)
  app.get('/api/admin/performance', isAdmin, async (req, res) => {
    try {
      console.log("Iniciando procesamiento de rendimiento");
      
      // Obtener parámetros de filtrado
      const fromDate = req.query.from ? new Date(req.query.from as string) : undefined;
      const toDate = req.query.to ? new Date(req.query.to as string) : undefined;
      const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : undefined;
      
      // Validar parámetros
      if (fromDate && isNaN(fromDate.getTime())) {
        return res.status(400).json({ message: 'Fecha inicial inválida' });
      }
      if (toDate && isNaN(toDate.getTime())) {
        return res.status(400).json({ message: 'Fecha final inválida' });
      }
      if (userId !== undefined && isNaN(userId)) {
        return res.status(400).json({ message: 'ID de usuario inválido' });
      }
      
      console.log(`Filtros aplicados - Desde: ${fromDate?.toISOString() || 'N/A'}, 
                   Hasta: ${toDate?.toISOString() || 'N/A'}, 
                   Usuario: ${userId || 'todos'}`);
                   
      // Obtener usuarios
      const allUsers = await storage.getAllUsers();
      console.log(`Usuarios obtenidos: ${allUsers.length}`);
      
      // Obtener actividades
      const activities = await storage.getUserActivities(1000, 0); // Obtener las últimas 1000 actividades
      console.log(`Actividades obtenidas: ${activities.length}`);
      
      // Si no hay actividades, devolver un objeto de respuesta vacío pero bien estructurado
      if (activities.length === 0) {
        console.log('No hay actividades para procesar');
        return res.json({
          users: [],
          overview: {
            mostActiveUser: { userId: 0, username: 'N/A', actionCount: 0 },
            leastActiveUser: { userId: 0, username: 'N/A', actionCount: 0 },
            fastestResponseTime: { userId: 0, username: 'N/A', responseTime: 0 },
            highestSuccessRate: { userId: 0, username: 'N/A', rate: 0 },
            totalActionsByDay: [],
            totalActionsByType: [],
            userComparisonData: []
          }
        });
      }
      
      // Logs detallados para depuración
      const sampleActivity = activities[0];
      console.log("Ejemplo de actividad:", {
        id: sampleActivity.id,
        userId: sampleActivity.userId,
        tipo: sampleActivity.tipo,
        timestamp: sampleActivity.timestamp,
        timestamp_type: typeof sampleActivity.timestamp,
        timestamp_json: JSON.stringify(sampleActivity.timestamp),
        completa: JSON.stringify(sampleActivity)
      });
      
      // Convertir todos los timestamps a objetos Date para evitar errores
      const activitiesWithValidDates = activities.map(activity => ({
        ...activity,
        timestamp: activity.timestamp instanceof Date 
          ? activity.timestamp 
          : typeof activity.timestamp === 'string' 
            ? new Date(activity.timestamp) 
            : new Date()
      }));
      
      console.log("Timestamps procesados para todas las actividades");
      
      // Filtrar actividades según los parámetros
      const filteredActivities = activitiesWithValidDates.filter(activity => {
        const activityTimestamp = activity.timestamp; // Ya es un objeto Date
        
        let includeActivity = true;
        
        if (fromDate) {
          includeActivity = includeActivity && activityTimestamp >= fromDate;
        }
        
        if (toDate) {
          includeActivity = includeActivity && activityTimestamp <= toDate;
        }
        
        if (userId !== undefined) {
          includeActivity = includeActivity && activity.userId === userId;
        }
        
        return includeActivity;
      });
      
      // Obtener presupuestos para relacionar con las actividades
      const budgets = await storage.getAllBudgets();
      
      // Calcular datos de rendimiento por usuario
      const userPerformanceData = allUsers.map(user => {
        // Filtrar actividades del usuario
        const userActivities = filteredActivities.filter(a => a.userId === user.id);
        
        // Agrupar por día
        const activityByDay = userActivities.reduce((acc: {date: string, count: number}[], activity) => {
          // Usar timestamp o fecha actual
          const timestamp = activity.timestamp ? new Date(activity.timestamp) : new Date();
          const date = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
          const existingDate = acc.find(item => item.date === date);
          
          if (existingDate) {
            existingDate.count += 1;
          } else {
            acc.push({ date, count: 1 });
          }
          
          return acc;
        }, []);
        
        // Ordenar por fecha
        activityByDay.sort((a, b) => a.date.localeCompare(b.date));
        
        // Agrupar por tipo
        const activityByType = userActivities.reduce((acc: {type: string, count: number}[], activity) => {
          const existingType = acc.find(item => item.type === activity.tipo);
          
          if (existingType) {
            existingType.count += 1;
          } else {
            acc.push({ type: activity.tipo, count: 1 });
          }
          
          return acc;
        }, []);
        
        // Calcular tareas completadas y pendientes
        const completedTasks = userActivities.filter(a => 
          a.tipo === 'task_completed' || 
          a.tipo === 'budget_finalized'
        ).length;
        
        const pendingTasks = userActivities.filter(a => 
          a.tipo === 'budget_created' || 
          a.tipo === 'budget_updated' ||
          a.tipo === 'import_csv'
        ).length - completedTasks;
        
        // Calcular tiempo promedio de respuesta (simplificado)
        // En una implementación real, se analizarían pares de creación/finalización
        const responseTimeHours = Math.random() * 24 + 1; // Simulado entre 1-25 horas
        
        // Top presupuestos del usuario
        const userBudgetActivities = userActivities.filter(a => a.entidadId);
        const budgetCounts = userBudgetActivities.reduce((acc: {[key: string]: number}, activity) => {
          if (activity.entidadId) {
            acc[activity.entidadId] = (acc[activity.entidadId] || 0) + 1;
          }
          return acc;
        }, {});
        
        const topBudgetsIds = Object.entries(budgetCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([budgetId]) => budgetId);
        
        const topBudgets = topBudgetsIds.map(budgetId => {
          const budget = budgets.find(b => b.id === budgetId);
          return {
            budgetId,
            empresa: budget ? budget.empresa : 'Desconocido',
            actionsCount: budgetCounts[budgetId]
          };
        });
        
        // Calcular tasa de éxito
        const successRate = completedTasks > 0 
          ? (completedTasks / (completedTasks + pendingTasks)) * 100 
          : 0;
        
        // Obtener última actividad
        const lastActive = userActivities.length > 0
          ? userActivities.sort((a, b) => {
              const dateA = a.timestamp ? new Date(a.timestamp) : new Date();
              const dateB = b.timestamp ? new Date(b.timestamp) : new Date();
              return dateB.getTime() - dateA.getTime();
            })[0].timestamp?.toISOString() || new Date().toISOString()
          : user.ultimoAcceso?.toISOString() || user.fechaCreacion?.toISOString() || new Date().toISOString();
        
        return {
          userId: user.id,
          username: user.username,
          nombre: user.nombre,
          apellido: user.apellido,
          totalActions: userActivities.length,
          completedTasks,
          pendingTasks,
          averageResponseTime: responseTimeHours,
          lastActive,
          successRate,
          activityByDay,
          activityByType,
          topBudgets
        };
      });
      
      // Calcular datos para la vista general
      const totalActionsByDay = filteredActivities.reduce((acc: {date: string, count: number}[], activity) => {
        // Usar timestamp o fecha actual
        const timestamp = activity.timestamp ? new Date(activity.timestamp) : new Date();
        const date = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
        const existingDate = acc.find(item => item.date === date);
        
        if (existingDate) {
          existingDate.count += 1;
        } else {
          acc.push({ date, count: 1 });
        }
        
        return acc;
      }, []);
      
      // Ordenar por fecha
      totalActionsByDay.sort((a, b) => a.date.localeCompare(b.date));
      
      // Agrupar por tipo
      const totalActionsByType = filteredActivities.reduce((acc: {type: string, count: number}[], activity) => {
        const existingType = acc.find(item => item.type === activity.tipo);
        
        if (existingType) {
          existingType.count += 1;
        } else {
          acc.push({ type: activity.tipo, count: 1 });
        }
        
        return acc;
      }, []);
      
      // Ordenar por cantidad (mayor a menor)
      totalActionsByType.sort((a, b) => b.count - a.count);
      
      // Identificar usuario más activo y menos activo
      const sortedByActivity = [...userPerformanceData].sort((a, b) => b.totalActions - a.totalActions);
      const mostActiveUser = sortedByActivity.length > 0 ? {
        userId: sortedByActivity[0].userId,
        username: sortedByActivity[0].username,
        actionCount: sortedByActivity[0].totalActions
      } : {
        userId: 0,
        username: 'N/A',
        actionCount: 0
      };
      
      const leastActiveUser = sortedByActivity.length > 0 ? {
        userId: sortedByActivity[sortedByActivity.length - 1].userId,
        username: sortedByActivity[sortedByActivity.length - 1].username,
        actionCount: sortedByActivity[sortedByActivity.length - 1].totalActions
      } : {
        userId: 0,
        username: 'N/A',
        actionCount: 0
      };
      
      // Identificar usuario con mejor tiempo de respuesta
      const sortedByResponseTime = [...userPerformanceData]
        .filter(u => u.totalActions > 0)
        .sort((a, b) => a.averageResponseTime - b.averageResponseTime);
      
      const fastestResponseTime = sortedByResponseTime.length > 0 ? {
        userId: sortedByResponseTime[0].userId,
        username: sortedByResponseTime[0].username,
        responseTime: sortedByResponseTime[0].averageResponseTime
      } : {
        userId: 0,
        username: 'N/A',
        responseTime: 0
      };
      
      // Identificar usuario con mayor tasa de éxito
      const sortedBySuccessRate = [...userPerformanceData]
        .filter(u => u.totalActions > 0)
        .sort((a, b) => b.successRate - a.successRate);
      
      const highestSuccessRate = sortedBySuccessRate.length > 0 ? {
        userId: sortedBySuccessRate[0].userId,
        username: sortedBySuccessRate[0].username,
        rate: sortedBySuccessRate[0].successRate
      } : {
        userId: 0,
        username: 'N/A',
        rate: 0
      };
      
      // Datos para comparación entre usuarios
      const userComparisonData = userPerformanceData.map(u => ({
        username: u.username,
        actions: u.totalActions,
        tasks: u.completedTasks,
        responseTime: u.averageResponseTime
      }));
      
      // Armar objeto de respuesta
      const result = {
        users: userPerformanceData,
        overview: {
          mostActiveUser,
          leastActiveUser,
          fastestResponseTime,
          highestSuccessRate,
          totalActionsByDay,
          totalActionsByType,
          userComparisonData
        }
      };
      
      res.json(result);
    } catch (error) {
      console.error('Error obteniendo datos de rendimiento:', error);
      res.status(500).json({ message: 'Error al obtener datos de rendimiento' });
    }
  });
  
  // Actualizar estado (activo/inactivo) de usuario (solo admin)
  app.patch('/api/admin/users/:userId', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'ID de usuario inválido' });
      }
      
      const updateSchema = z.object({
        activo: z.boolean()
      });
      
      const validatedData = updateSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: 'Datos inválidos', 
          errors: validatedData.error.format() 
        });
      }
      
      const { activo } = validatedData.data;
      
      // Verificar si el usuario existe
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      // Actualizar el estado del usuario
      const updatedUser = await storage.updateUser(userId, { activo });
      
      // Registrar la actividad
      if (req.user) {
        await logUserActivity(
          req.user.id, 
          "user_update", 
          `Usuario ${req.user.username} ${activo ? 'activó' : 'desactivó'} al usuario ${user.username}`,
          String(userId)
        );
      }
      
      // Eliminar contraseña antes de enviar
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error actualizando estado de usuario:', error);
      res.status(500).json({ message: 'Error al actualizar estado de usuario' });
    }
  });
  
  // Aprobar/rechazar usuario (solo admin)
  app.patch('/api/admin/users/:userId/approve', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'ID de usuario inválido' });
      }
      
      const approvalSchema = z.object({
        approved: z.boolean()
      });
      
      const validatedData = approvalSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: 'Datos inválidos', 
          errors: validatedData.error.format() 
        });
      }
      
      const { approved } = validatedData.data;
      
      // Verificar si el usuario existe
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      // No permitir cambiar el estado de aprobación de administradores
      if (user.rol === 'admin') {
        return res.status(403).json({ 
          message: 'No se puede cambiar el estado de aprobación de un administrador' 
        });
      }
      
      // Actualizar el estado de aprobación
      const updatedUser = await storage.updateUser(userId, { aprobado: approved });
      
      // Registrar la actividad
      if (req.user) {
        await logUserActivity(
          req.user.id, 
          "user_approval", 
          `Usuario ${req.user.username} ${approved ? 'aprobó' : 'rechazó'} al usuario ${user.username}`,
          String(userId)
        );
      }
      
      // Eliminar contraseña antes de enviar
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error actualizando aprobación de usuario:', error);
      res.status(500).json({ message: 'Error al actualizar aprobación de usuario' });
    }
  });

  // Import demo CSV file
  app.post('/api/import/demo', isAuthenticated, async (req, res) => {
    try {
      const optionsSchema = z.object({
        options: z.object({
          compareWithPrevious: z.boolean(),
          autoFinalizeMissing: z.boolean(),
        }),
      });
      
      const validatedData = optionsSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: 'Invalid options data', 
          errors: validatedData.error.format() 
        });
      }
      
      const { options } = validatedData.data;
      
      // Leer el archivo CSV de demostración directamente desde el servidor
      const csvFilePath = path.join(process.cwd(), 'attached_assets', 'PRESUPUESTOS_CON_ITEMS.csv');
      console.log(`Leyendo archivo CSV de demostración: ${csvFilePath}`);
      const csvData = readFileSync(csvFilePath, 'utf-8');
      
      // Procesar e importar los datos
      const result = await storage.importCsvData(csvData, options);
      
      // Registrar la importación
      await storage.createImportLog({
        fileName: 'PRESUPUESTOS_CON_ITEMS.csv',
        recordsImported: result.added,
        recordsUpdated: result.updated,
        recordsDeleted: result.deleted,
      });
      
      // Registrar la actividad
      if (req.user) {
        await logUserActivity(
          req.user.id, 
          "import_demo", 
          `Usuario ${req.user.username} importó CSV de demostración con ${result.added} nuevos, ${result.updated} actualizados, ${result.deleted} eliminados`,
          "demo_csv",
          { ...options, totalRecords: result.total }
        );
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error importing demo CSV:', error);
      res.status(500).json({ message: 'Failed to import demo CSV data' });
    }
  });

  // Rutas para manejo de reportes
  app.get('/api/reports', isAuthenticated, async (req, res) => {
    try {
      // Obtener reportes generados
      const reports = await storage.getAllReports();
      res.json(reports);
    } catch (error) {
      console.error('Error obteniendo reportes:', error);
      res.status(500).json({ message: 'Error al obtener reportes' });
    }
  });

  app.post('/api/reports/generate', isAuthenticated, async (req, res) => {
    try {
      const reportSchema = z.object({
        type: z.enum(['summary', 'performance', 'manufacturer', 'client']),
        from: z.string(),
        to: z.string(),
        format: z.enum(['excel', 'pdf', 'csv'])
      });
      
      const validatedData = reportSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: 'Datos de reporte inválidos', 
          errors: validatedData.error.format()
        });
      }
      
      const { type, from, to, format } = validatedData.data;
      
      // Crear un título basado en el tipo de reporte
      let titulo = '';
      switch (type) {
        case 'summary': titulo = 'Resumen General de Presupuestos'; break;
        case 'performance': titulo = 'Análisis de Desempeño de Presupuestos'; break;
        case 'manufacturer': titulo = 'Análisis por Fabricante'; break;
        case 'client': titulo = 'Análisis por Cliente'; break;
      }
      
      // Añadir fecha al título
      titulo += ` (${from} al ${to})`;
      
      // Crear reporte
      const newReport = await storage.createReport({
        titulo,
        tipo: type,
        formato: format,
        rutaArchivo: `/reports/${Date.now()}_${type}.${format}`,
        tamano: '120 KB', // Tamaño estimado
        usuarioId: req.user!.id,
        parametros: {
          dateRange: [from, to],
          reportType: [type],
          format: [format]
        }
      });
      
      // Registrar la actividad
      await logUserActivity(
        req.user!.id,
        "report_generate",
        `Usuario ${req.user!.username} generó un reporte: ${titulo}`,
        newReport.id.toString(),
        { type, from, to, format }
      );
      
      res.status(201).json(newReport);
    } catch (error) {
      console.error('Error generando reporte:', error);
      res.status(500).json({ message: 'Error al generar reporte' });
    }
  });
  
  app.get('/api/reports/:id/download', isAuthenticated, async (req, res) => {
    try {
      const reportId = parseInt(req.params.id, 10);
      if (isNaN(reportId)) {
        return res.status(400).json({ message: 'ID de reporte inválido' });
      }
      
      // Buscar el reporte
      const report = await storage.getReportById(reportId);
      if (!report) {
        return res.status(404).json({ message: 'Reporte no encontrado' });
      }
      
      // En un sistema real, aquí se buscaría el archivo físico
      // Para este ejemplo, generamos un contenido simple según el formato
      let fileContent;
      let contentType;
      let extension;
      
      switch (report.formato) {
        case 'excel':
          // En un sistema real se generaría un archivo Excel
          fileContent = Buffer.from('PK\u0003\u0004\u0014\u0000\u0000\u0000\b\u0000\u0000\u0000 \u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0013\u0000\u0000\u0000[Content_Types].xml\u00ad\u0090\u00cdN\u00c20\u0010\u0000\u00ef\u00e2+\u0096H\u00a2\u00ad\u0088\u00aa\u00f0\u00000\u0089 \b\u0088\u0097\u00db\u00ddv%m\u0092\u00c4\u00db\u00edE\u00fe\u00fb\u00b6\u0087V\u00e1\u0092\u00f3\u00ce\u0099\u00ef\u00cc\u00e4\u00c3\u00db\u00baL\u00b6\u0088U\u0081\u0012\u00f3\u00ees\u0092\u00c0\u00b0@\u00f3\u0012\u00c6\u00f3\u00b9\u00fd\u00bc{\u0090\u00b4\u0089\u00865l\u00c8p*\u00e1b>W\'E\u00f2\u00be\u00c8\r\u00b8\u0000\u00cc\u0006\u00e2\u0085\u0081\u0095\u00df|\u00fa\u0081\u0096\u00aaS\u00f7\u00d6\u00d5\u00aex\u00c6r\u00fa\u000f\u00c3\u00af\u00f2\u00c9\u00e8\u00e8L\u00e0\u00fdA\u00fbW|\u00e1\u00a9\u00d4\u00bb\'\u00ea\u00cd\u001bg~b\u00af\u0091\u00fe\u00c3<\u00f9\u00f9V\u0018\u0094\u0096\"\u00d8\u00c3\u00fc\u00c5]G\u00fdf\u00e9A\r\u00f89\u00ce\u0084\u0019 \u00d0\u00b9\u00af>\u00c2\u00bec\u00ee\u00ef\u00a3\u0093\u00a2\u009a\u00e2\u00ac\u00bd\u001ew/\u00ebR\u0090\u00c3\u00d1\u00c1{\u00f3\u0000\u0000PK\u0001\u0002\u0014\u0000\u0014\u0000\b\u0000\b\u0000 \u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0013\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000 \u0000\u0000\u0000\u0000\u0000\u0000\u0000[Content_Types].xmlPK\u0005\u0006\u0000\u0000\u0000\u0000\u0001\u0000\u0001\u0000A\u0000\u0000\u0000N\u0000\u0000\u0000\u0000\u0000');
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          extension = 'xlsx';
          break;
        case 'pdf':
          // Crear un PDF válido con contenido mínimo
          fileContent = Buffer.from('%PDF-1.5\n1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<<>>/Contents 4 0 R>>\nendobj\n4 0 obj\n<</Length 44>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Reporte generado) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n0000000212 00000 n\ntrailer\n<</Size 5/Root 1 0 R>>\nstartxref\n304\n%%EOF\n');
          contentType = 'application/pdf';
          extension = 'pdf';
          break;
        case 'csv':
          // En un sistema real se generaría un CSV
          fileContent = Buffer.from('id,empresa,monto,estado\n1,RIZOBACTER ARGENTINA S.A.,12500.00,Pendiente\n2,ROLANPLAST SRL,8750.50,Aprobado\n3,SINFONIA AGROALIMENTARIA SRL,15000.00,Rechazado\n');
          contentType = 'text/csv';
          extension = 'csv';
          break;
        default:
          fileContent = Buffer.from('Contenido no válido');
          contentType = 'text/plain';
          extension = 'txt';
      }
      
      // Registrar la actividad de descarga
      await logUserActivity(
        req.user!.id,
        "report_download",
        `Usuario ${req.user!.username} descargó el reporte: ${report.titulo}`,
        report.id.toString()
      );
      
      // Enviar el archivo
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${report.titulo.replace(/\s+/g, '_')}.${extension}"`);
      res.send(fileContent);
    } catch (error) {
      console.error('Error descargando reporte:', error);
      res.status(500).json({ message: 'Error al descargar reporte' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
