import { 
  Budget, 
  BudgetItem, 
  ContactInfo, 
  ImportLog, 
  InsertBudget, 
  InsertBudgetItem, 
  InsertContactInfo, 
  InsertImportLog, 
  User, 
  InsertUser,
  UserActivity,
  InsertUserActivity,
  budgets,
  budgetItems,
  contactInfo,
  importLogs,
  users,
  userActivities
} from "@shared/schema";
import { convertCsvToBudgets, compareBudgets } from "../client/src/lib/csvParser";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Budget operations
  getAllBudgets(): Promise<Budget[]>;
  getBudget(id: string): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: string, budgetData: Partial<InsertBudget>): Promise<Budget | undefined>;
  deleteBudget(id: string): Promise<boolean>;
  
  // Budget items operations
  getBudgetItems(budgetId: string): Promise<BudgetItem[]>;
  createBudgetItem(item: InsertBudgetItem): Promise<BudgetItem>;
  
  // Contact operations
  getAllContacts(): Promise<(ContactInfo & { budgetId: string })[]>;
  getContact(budgetId: string): Promise<(ContactInfo & { budgetId: string }) | undefined>;
  createContact(budgetId: string, contact: Omit<InsertContactInfo, 'budgetId'>): Promise<ContactInfo & { budgetId: string }>;
  updateContact(budgetId: string, contactData: Partial<Omit<InsertContactInfo, 'budgetId'>>): Promise<(ContactInfo & { budgetId: string }) | undefined>;
  
  // Import operations
  importCsvData(csvData: string, options: { compareWithPrevious: boolean; autoFinalizeMissing: boolean }): Promise<{ added: number; updated: number; deleted: number; total: number }>;
  getImportLogs(): Promise<ImportLog[]>;
  createImportLog(log: Omit<InsertImportLog, 'id'>): Promise<ImportLog>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Budget operations
  async getAllBudgets(): Promise<Budget[]> {
    const dbBudgets = await db.select().from(budgets);
    return dbBudgets as Budget[];
  }

  async getBudget(id: string): Promise<Budget | undefined> {
    const [budget] = await db.select().from(budgets).where(eq(budgets.id, id));
    return budget as Budget | undefined;
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const valueWithId = {
      ...insertBudget,
      id: insertBudget.id || Date.now().toString()
    };
    
    const [budget] = await db
      .insert(budgets)
      .values(valueWithId)
      .returning();
    
    return budget as Budget;
  }

  async updateBudget(id: string, budgetData: Partial<InsertBudget>): Promise<Budget | undefined> {
    const [updatedBudget] = await db
      .update(budgets)
      .set(budgetData as any)
      .where(eq(budgets.id, id))
      .returning();
    
    return updatedBudget as Budget | undefined;
  }

  async deleteBudget(id: string): Promise<boolean> {
    const [deletedBudget] = await db
      .delete(budgets)
      .where(eq(budgets.id, id))
      .returning();
    
    return !!deletedBudget;
  }

  // Budget items operations
  async getBudgetItems(budgetId: string): Promise<BudgetItem[]> {
    const items = await db
      .select()
      .from(budgetItems)
      .where(eq(budgetItems.budgetId, budgetId));
    
    return items as BudgetItem[];
  }

  async createBudgetItem(insertItem: InsertBudgetItem): Promise<BudgetItem> {
    const [item] = await db
      .insert(budgetItems)
      .values(insertItem as any)
      .returning();
    
    return item as BudgetItem;
  }

  // Contact operations
  async getAllContacts(): Promise<(ContactInfo & { budgetId: string })[]> {
    const contacts = await db.select().from(contactInfo);
    return contacts as (ContactInfo & { budgetId: string })[];
  }

  async getContact(budgetId: string): Promise<(ContactInfo & { budgetId: string }) | undefined> {
    const [contact] = await db
      .select()
      .from(contactInfo)
      .where(eq(contactInfo.budgetId, budgetId));
    
    return contact as (ContactInfo & { budgetId: string }) | undefined;
  }

  async createContact(budgetId: string, contact: Omit<InsertContactInfo, 'budgetId'>): Promise<ContactInfo & { budgetId: string }> {
    const [newContact] = await db
      .insert(contactInfo)
      .values({
        ...contact,
        budgetId
      } as any)
      .returning();
    
    return newContact as ContactInfo & { budgetId: string };
  }

  async updateContact(budgetId: string, contactData: Partial<Omit<InsertContactInfo, 'budgetId'>>): Promise<(ContactInfo & { budgetId: string }) | undefined> {
    const [updatedContact] = await db
      .update(contactInfo)
      .set(contactData as any)
      .where(eq(contactInfo.budgetId, budgetId))
      .returning();
    
    return updatedContact as (ContactInfo & { budgetId: string }) | undefined;
  }

  // Import operations
  async importCsvData(csvData: string, options: { compareWithPrevious: boolean; autoFinalizeMissing: boolean }): Promise<{ added: number; updated: number; deleted: number; total: number }> {
    try {
      // Parse CSV data into budgets
      const newBudgets = await convertCsvToBudgets(csvData);
      const existingBudgets = await this.getAllBudgets();
      
      // Compare with existing budgets
      const compareResult = compareBudgets(existingBudgets, newBudgets, options);
      
      // Process budgets to add or update
      for (const budget of newBudgets) {
        // Check if budget already exists
        const existingBudget = await this.getBudget(budget.id);
        
        if (existingBudget) {
          // Update existing budget, preserving user-entered data
          await this.updateBudget(budget.id, {
            ...budget,
            notas: existingBudget.notas,
            completado: existingBudget.completado,
            estado: existingBudget.estado,
          });
        } else {
          // Create new budget
          await this.createBudget(budget);
        }
        
        // Process budget items
        if (budget.items && budget.items.length > 0) {
          // Clear existing items for this budget
          await db
            .delete(budgetItems)
            .where(eq(budgetItems.budgetId, budget.id));
          
          // Add new items
          for (const item of budget.items) {
            await this.createBudgetItem({
              budgetId: budget.id,
              codigo: item.codigo,
              descripcion: item.descripcion,
              precio: item.precio,
              cantidad: item.cantidad || 1,
            });
          }
        }
      }
      
      // Handle missing budgets (deleted/finalized)
      if (options.autoFinalizeMissing && options.compareWithPrevious) {
        const newBudgetIds = new Set(newBudgets.map(b => b.id));
        
        for (const existingBudget of existingBudgets) {
          if (!newBudgetIds.has(existingBudget.id) && !existingBudget.finalizado) {
            await this.updateBudget(existingBudget.id, {
              finalizado: true,
              fechaFinalizado: new Date().toISOString().split('T')[0],
              estado: 'Vencido',
              fechaEstado: new Date().toISOString().split('T')[0],
            });
          }
        }
      }
      
      return compareResult;
    } catch (error) {
      console.error('Error importing CSV data:', error);
      throw error;
    }
  }

  async getImportLogs(): Promise<ImportLog[]> {
    const logs = await db
      .select()
      .from(importLogs)
      .orderBy(desc(importLogs.timestamp));
    
    return logs as ImportLog[];
  }

  async createImportLog(log: Omit<InsertImportLog, 'id'>): Promise<ImportLog> {
    const [importLog] = await db
      .insert(importLogs)
      .values(log as any)
      .returning();
    
    return importLog as ImportLog;
  }
}

// Initialize the storage
export const storage = new DatabaseStorage();
