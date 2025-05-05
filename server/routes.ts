import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from 'zod';
import { insertContactInfoSchema, insertBudgetSchema } from '@shared/schema';

export async function registerRoutes(app: Express): Promise<Server> {
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
  app.patch('/api/budgets/:id', async (req, res) => {
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
  app.post('/api/contacts', async (req, res) => {
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
      } else {
        contact = await storage.createContact(budgetId, contactData);
      }
      
      res.json(contact);
    } catch (error) {
      console.error('Error creating/updating contact:', error);
      res.status(500).json({ message: 'Failed to create/update contact' });
    }
  });

  // Import CSV data
  app.post('/api/import', async (req, res) => {
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
      
      res.json(result);
    } catch (error) {
      console.error('Error importing CSV:', error);
      res.status(500).json({ message: 'Failed to import CSV data' });
    }
  });

  // Get import logs
  app.get('/api/import-logs', async (req, res) => {
    try {
      const logs = await storage.getImportLogs();
      res.json(logs);
    } catch (error) {
      console.error('Error fetching import logs:', error);
      res.status(500).json({ message: 'Failed to fetch import logs' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
