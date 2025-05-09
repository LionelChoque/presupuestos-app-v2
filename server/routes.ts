import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from 'zod';
import { insertContactInfoSchema, insertBudgetSchema } from '@shared/schema';
import { readFileSync } from 'fs';
import path from 'path';
import { setupAuth, isAuthenticated, isAdmin, logUserActivity } from './auth';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

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

  // Hacer administrador a un usuario (solo admin)
  app.patch('/api/admin/users/:userId/make-admin', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'ID de usuario inválido' });
      }
      
      // Verificar si el usuario existe
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      if (user.rol === 'admin') {
        return res.status(400).json({ message: 'El usuario ya es administrador' });
      }
      
      // Actualizar el rol a admin
      const updatedUser = await storage.updateUser(userId, { rol: 'admin' });
      
      // Registrar la actividad
      if (req.user) {
        await logUserActivity(
          req.user.id, 
          "user_make_admin", 
          `Usuario ${req.user.username} convirtió en administrador al usuario ${user.username}`,
          String(userId)
        );
      }
      
      // Eliminar contraseña antes de enviar
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error haciendo administrador al usuario:', error);
      res.status(500).json({ message: 'Error al hacer administrador al usuario' });
    }
  });
  
  // Resetear contraseña de usuario (solo admin)
  app.post('/api/admin/users/:userId/reset-password', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'ID de usuario inválido' });
      }
      
      const passwordSchema = z.object({
        newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
      });
      
      const validatedData = passwordSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: 'Datos inválidos', 
          errors: validatedData.error.format() 
        });
      }
      
      const { newPassword } = validatedData.data;
      
      // Verificar si el usuario existe
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      // Hashear la nueva contraseña
      const hashedPassword = await hashPassword(newPassword);
      
      // Actualizar la contraseña
      const updatedUser = await storage.updateUser(userId, { password: hashedPassword });
      
      // Registrar la actividad
      if (req.user) {
        await logUserActivity(
          req.user.id, 
          "user_reset_password", 
          `Usuario ${req.user.username} reseteo la contraseña del usuario ${user.username}`,
          String(userId)
        );
      }
      
      res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
      console.error('Error al resetear contraseña:', error);
      res.status(500).json({ message: 'Error al resetear contraseña del usuario' });
    }
  });
  
  // Eliminar usuario (solo admin)
  app.delete('/api/admin/users/:userId', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'ID de usuario inválido' });
      }
      
      // Verificar si el usuario existe
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      // Evitar que un administrador se elimine a sí mismo
      if (req.user && req.user.id === userId) {
        return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta' });
      }
      
      // Eliminar usuario
      await storage.deleteUser(userId);
      
      // Registrar la actividad
      if (req.user) {
        await logUserActivity(
          req.user.id, 
          "user_delete", 
          `Usuario ${req.user.username} eliminó al usuario ${user.username}`,
          String(userId)
        );
      }
      
      res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      res.status(500).json({ message: 'Error al eliminar usuario' });
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
      
      // Generar contenido según el formato
      let fileContent;
      let contentType;
      let extension;
      
      switch (report.formato) {
        case 'excel':
          // Crear un workbook de Excel válido
          const workbook = XLSX.utils.book_new();
          
          // Datos de ejemplo para el reporte
          const data = [
            ['ID', 'Empresa', 'Monto', 'Estado'],
            ['32949', 'RIZOBACTER ARGENTINA S.A.', '12500.00', 'Pendiente'],
            ['24538', 'ROLANPLAST SRL', '8750.50', 'Aprobado'],
            ['19872', 'SINFONIA AGROALIMENTARIA SRL', '15000.00', 'Rechazado'],
            ['35271', 'INGENIERIA DELTA S.A.', '22300.75', 'Pendiente'],
            ['27894', 'MAQUINARIAS DEL SUR', '17500.00', 'Aprobado']
          ];
          
          // Crear una hoja y añadirla al workbook
          const worksheet = XLSX.utils.aoa_to_sheet(data);
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
          
          // Convertir a buffer
          const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
          fileContent = excelBuffer;
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          extension = 'xlsx';
          break;
          
        case 'pdf':
          // Crear un PDF con PDFKit
          const doc = new PDFDocument({
            margin: 50,
            size: 'A4'
          });
          
          // Capturar el contenido en un buffer
          const chunks: Buffer[] = [];
          doc.on('data', (chunk: Buffer) => chunks.push(chunk));
          
          // Contenido del PDF
          doc.fontSize(25)
             .text(report.titulo, { align: 'center' });
          
          doc.moveDown(2);
          doc.fontSize(12)
             .text('Fecha de generación: ' + new Date().toLocaleDateString('es-AR'));
          
          doc.moveDown();
          doc.text('Este reporte contiene información sobre los presupuestos en el sistema.');
          
          doc.moveDown(2);
          // Tabla simple
          const tableData = [
            { id: '32949', empresa: 'RIZOBACTER ARGENTINA S.A.', monto: '12500.00', estado: 'Pendiente' },
            { id: '24538', empresa: 'ROLANPLAST SRL', monto: '8750.50', estado: 'Aprobado' },
            { id: '19872', empresa: 'SINFONIA AGROALIMENTARIA SRL', monto: '15000.00', estado: 'Rechazado' },
            { id: '35271', empresa: 'INGENIERIA DELTA S.A.', monto: '22300.75', estado: 'Pendiente' },
            { id: '27894', empresa: 'MAQUINARIAS DEL SUR', monto: '17500.00', estado: 'Aprobado' }
          ];
          
          // Encabezados
          let yPos = doc.y;
          const tableTop = yPos;
          doc.font('Helvetica-Bold');
          doc.text('ID', 50, yPos, { width: 60 });
          doc.text('Empresa', 110, yPos, { width: 200 });
          doc.text('Monto', 310, yPos, { width: 80 });
          doc.text('Estado', 390, yPos, { width: 100 });
          
          // Filas
          doc.font('Helvetica');
          for (let i = 0; i < tableData.length; i++) {
            yPos += 20;
            doc.text(tableData[i].id, 50, yPos, { width: 60 });
            doc.text(tableData[i].empresa, 110, yPos, { width: 200 });
            doc.text(tableData[i].monto, 310, yPos, { width: 80 });
            doc.text(tableData[i].estado, 390, yPos, { width: 100 });
          }
          
          // Dibujar líneas
          doc.rect(50, tableTop - 5, 490, (tableData.length + 1) * 20 + 10).stroke();
          
          // Finalizar el documento
          doc.end();
          
          // Esperar a que se complete la generación y convertir a buffer
          await new Promise<void>((resolve) => {
            doc.on('end', () => resolve());
          });
          
          fileContent = Buffer.concat(chunks);
          contentType = 'application/pdf';
          extension = 'pdf';
          break;
          
        case 'csv':
          // Generar un CSV con datos de ejemplo
          const csvContent = 'ID,Empresa,Monto,Estado\n' +
            '32949,RIZOBACTER ARGENTINA S.A.,12500.00,Pendiente\n' +
            '24538,ROLANPLAST SRL,8750.50,Aprobado\n' +
            '19872,SINFONIA AGROALIMENTARIA SRL,15000.00,Rechazado\n' +
            '35271,INGENIERIA DELTA S.A.,22300.75,Pendiente\n' +
            '27894,MAQUINARIAS DEL SUR,17500.00,Aprobado\n';
            
          fileContent = Buffer.from(csvContent);
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

  // ======================= BADGES / INSIGNIAS API =======================

  // Obtener todas las insignias
  app.get('/api/badges', async (req, res) => {
    try {
      const badges = await storage.getAllBadges();
      res.json(badges);
    } catch (error) {
      console.error('Error al obtener insignias:', error);
      res.status(500).json({ message: 'Error al obtener insignias' });
    }
  });

  // Obtener una insignia específica
  app.get('/api/badges/:id', async (req, res) => {
    try {
      const badgeId = parseInt(req.params.id, 10);
      
      if (isNaN(badgeId)) {
        return res.status(400).json({ message: 'ID de insignia inválido' });
      }
      
      const badge = await storage.getBadgeById(badgeId);
      
      if (!badge) {
        return res.status(404).json({ message: 'Insignia no encontrada' });
      }
      
      res.json(badge);
    } catch (error) {
      console.error('Error al obtener insignia:', error);
      res.status(500).json({ message: 'Error al obtener insignia' });
    }
  });

  // Crear una nueva insignia (solo admin)
  app.post('/api/badges', isAdmin, async (req, res) => {
    try {
      const badgeSchema = z.object({
        nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
        descripcion: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
        tipoObjetivo: z.string(),
        valorObjetivo: z.string(), // Valor objetivo como string para mantener consistencia con el schema
        icono: z.string(),
        color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color debe ser un valor hexadecimal válido'),
        publico: z.boolean().optional().default(false)
      });
      
      const validatedData = badgeSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: 'Datos de insignia inválidos', 
          errors: validatedData.error.format() 
        });
      }
      
      const badge = await storage.createBadge({
        ...validatedData.data,
        creadorId: req.user!.id
      });
      
      // Registrar actividad
      await logUserActivity(
        req.user!.id,
        "badge_created",
        `Usuario ${req.user!.username} creó la insignia: ${badge.nombre}`,
        badge.id.toString()
      );
      
      res.status(201).json(badge);
    } catch (error) {
      console.error('Error al crear insignia:', error);
      res.status(500).json({ message: 'Error al crear insignia' });
    }
  });

  // Actualizar una insignia (solo admin)
  app.patch('/api/badges/:id', isAdmin, async (req, res) => {
    try {
      const badgeId = parseInt(req.params.id, 10);
      
      if (isNaN(badgeId)) {
        return res.status(400).json({ message: 'ID de insignia inválido' });
      }
      
      const badgeUpdateSchema = z.object({
        nombre: z.string().min(3).optional(),
        descripcion: z.string().min(10).optional(),
        tipoObjetivo: z.string().optional(),
        valorObjetivo: z.string().optional(),
        icono: z.string().optional(),
        color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
        activo: z.boolean().optional(),
        publico: z.boolean().optional()
      });
      
      const validatedData = badgeUpdateSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: 'Datos de actualización inválidos', 
          errors: validatedData.error.format() 
        });
      }
      
      const updatedBadge = await storage.updateBadge(badgeId, validatedData.data);
      
      if (!updatedBadge) {
        return res.status(404).json({ message: 'Insignia no encontrada' });
      }
      
      // Registrar actividad
      await logUserActivity(
        req.user!.id,
        "badge_updated",
        `Usuario ${req.user!.username} actualizó la insignia: ${updatedBadge.nombre}`,
        updatedBadge.id.toString()
      );
      
      res.json(updatedBadge);
    } catch (error) {
      console.error('Error al actualizar insignia:', error);
      res.status(500).json({ message: 'Error al actualizar insignia' });
    }
  });

  // Eliminar una insignia (solo admin)
  app.delete('/api/badges/:id', isAdmin, async (req, res) => {
    try {
      const badgeId = parseInt(req.params.id, 10);
      
      if (isNaN(badgeId)) {
        return res.status(400).json({ message: 'ID de insignia inválido' });
      }
      
      // Primero obtenemos la insignia para registro
      const badge = await storage.getBadgeById(badgeId);
      
      if (!badge) {
        return res.status(404).json({ message: 'Insignia no encontrada' });
      }
      
      const deleted = await storage.deleteBadge(badgeId);
      
      if (!deleted) {
        return res.status(404).json({ message: 'No se pudo eliminar la insignia' });
      }
      
      // Registrar actividad
      await logUserActivity(
        req.user!.id,
        "badge_deleted",
        `Usuario ${req.user!.username} eliminó la insignia: ${badge.nombre}`,
        badge.id.toString()
      );
      
      res.json({ message: 'Insignia eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar insignia:', error);
      res.status(500).json({ message: 'Error al eliminar insignia' });
    }
  });

  // Obtener insignias de un usuario
  app.get('/api/users/:userId/badges', isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'ID de usuario inválido' });
      }
      
      // Verificar permiso (solo admin o el propio usuario)
      if (req.user!.id !== userId && req.user!.rol !== 'admin') {
        return res.status(403).json({ message: 'No autorizado para ver estas insignias' });
      }
      
      const userBadges = await storage.getUserBadges(userId);
      res.json(userBadges);
    } catch (error) {
      console.error('Error al obtener insignias del usuario:', error);
      res.status(500).json({ message: 'Error al obtener insignias del usuario' });
    }
  });

  // Asignar una insignia a un usuario (solo admin)
  app.post('/api/users/:userId/badges', isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'ID de usuario inválido' });
      }
      
      const assignSchema = z.object({
        badgeId: z.number().int()
      });
      
      const validatedData = assignSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: 'Datos de asignación inválidos', 
          errors: validatedData.error.format() 
        });
      }
      
      const { badgeId } = validatedData.data;
      
      // Comprobar que el usuario existe
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      // Comprobar que la insignia existe
      const badge = await storage.getBadgeById(badgeId);
      
      if (!badge) {
        return res.status(404).json({ message: 'Insignia no encontrada' });
      }
      
      const userBadge = await storage.assignBadgeToUser(userId, badgeId);
      
      // Registrar actividad
      await logUserActivity(
        req.user!.id,
        "badge_assigned",
        `Usuario ${req.user!.username} asignó la insignia ${badge.nombre} al usuario ${user.username}`,
        badge.id.toString(),
        { userId, badgeId }
      );
      
      res.status(201).json(userBadge);
    } catch (error) {
      console.error('Error al asignar insignia:', error);
      res.status(500).json({ message: 'Error al asignar insignia' });
    }
  });

  // Actualizar el progreso de una insignia
  app.patch('/api/users/:userId/badges/:badgeId/progress', isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      const badgeId = parseInt(req.params.badgeId, 10);
      
      if (isNaN(userId) || isNaN(badgeId)) {
        return res.status(400).json({ message: 'IDs inválidos' });
      }
      
      // Verificar permiso (solo admin o el propio usuario)
      if (req.user!.id !== userId && req.user!.rol !== 'admin') {
        return res.status(403).json({ message: 'No autorizado para actualizar este progreso' });
      }
      
      const progressSchema = z.object({
        progress: z.number().min(0)
      });
      
      const validatedData = progressSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: 'Datos de progreso inválidos', 
          errors: validatedData.error.format() 
        });
      }
      
      const { progress } = validatedData.data;
      
      // Obtener la insignia para verificar si se ha completado
      const badge = await storage.getBadgeById(badgeId);
      
      if (!badge) {
        return res.status(404).json({ message: 'Insignia no encontrada' });
      }
      
      const updatedBadge = await storage.updateUserBadgeProgress(userId, badgeId, progress);
      
      if (!updatedBadge) {
        return res.status(404).json({ message: 'Asignación de insignia no encontrada' });
      }
      
      // Si el progreso alcanza o supera el valor objetivo, marcar como completada
      if (progress >= Number(badge.valorObjetivo) && !updatedBadge.completado) {
        await storage.markBadgeAsCompleted(userId, badgeId);
        
        // Registrar actividad de logro completado
        await logUserActivity(
          userId,
          "badge_completed",
          `Usuario completó la insignia: ${badge.nombre}`,
          badge.id.toString(),
          { progress }
        );
      }
      
      res.json(updatedBadge);
    } catch (error) {
      console.error('Error al actualizar progreso:', error);
      res.status(500).json({ message: 'Error al actualizar progreso' });
    }
  });

  // Marcar una insignia como mostrada (para notificaciones)
  app.patch('/api/users/:userId/badges/:badgeId/shown', isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      const badgeId = parseInt(req.params.badgeId, 10);
      
      if (isNaN(userId) || isNaN(badgeId)) {
        return res.status(400).json({ message: 'IDs inválidos' });
      }
      
      // Verificar permiso (solo el propio usuario)
      if (req.user!.id !== userId) {
        return res.status(403).json({ message: 'No autorizado para actualizar este estado' });
      }
      
      const updatedBadge = await storage.markBadgeAsShown(userId, badgeId);
      
      if (!updatedBadge) {
        return res.status(404).json({ message: 'Asignación de insignia no encontrada' });
      }
      
      res.json(updatedBadge);
    } catch (error) {
      console.error('Error al marcar insignia como mostrada:', error);
      res.status(500).json({ message: 'Error al actualizar estado de insignia' });
    }
  });

  // Obtener insignias completadas recientemente (para notificaciones)
  app.get('/api/users/:userId/badges/recent', isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'ID de usuario inválido' });
      }
      
      // Verificar permiso (solo el propio usuario)
      if (req.user!.id !== userId) {
        return res.status(403).json({ message: 'No autorizado para ver estas insignias' });
      }
      
      const recentBadges = await storage.getRecentlyCompletedBadges(userId);
      res.json(recentBadges);
    } catch (error) {
      console.error('Error al obtener insignias recientes:', error);
      res.status(500).json({ message: 'Error al obtener insignias recientes' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
