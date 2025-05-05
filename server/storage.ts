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
  budgets,
  budgetItems,
  contactInfo,
  importLogs
} from "@shared/schema";
import { convertCsvToBudgets, compareBudgets } from "../client/src/lib/csvParser";

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
  updateContact(budgetId: string, contactData: Partial<Omit<InsertContactInfo, 'budgetId'>>): Promise<ContactInfo & { budgetId: string } | undefined>;
  
  // Import operations
  importCsvData(csvData: string, options: { compareWithPrevious: boolean; autoFinalizeMissing: boolean }): Promise<{ added: number; updated: number; deleted: number; total: number }>;
  getImportLogs(): Promise<ImportLog[]>;
  createImportLog(log: Omit<InsertImportLog, 'id'>): Promise<ImportLog>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private budgets: Map<string, Budget>;
  private budgetItems: Map<number, BudgetItem>;
  private contacts: Map<string, ContactInfo & { budgetId: string }>;
  private importLogs: ImportLog[];
  private userId: number;
  private budgetItemId: number;
  private importLogId: number;

  constructor() {
    this.users = new Map();
    this.budgets = new Map();
    this.budgetItems = new Map();
    this.contacts = new Map();
    this.importLogs = [];
    this.userId = 1;
    this.budgetItemId = 1;
    this.importLogId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Budget operations
  async getAllBudgets(): Promise<Budget[]> {
    return Array.from(this.budgets.values());
  }

  async getBudget(id: string): Promise<Budget | undefined> {
    return this.budgets.get(id);
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const budget: Budget = {
      ...insertBudget,
      id: insertBudget.id || Date.now().toString(), // Use provided ID or generate a new one
    };
    this.budgets.set(budget.id, budget);
    return budget;
  }

  async updateBudget(id: string, budgetData: Partial<InsertBudget>): Promise<Budget | undefined> {
    const existingBudget = this.budgets.get(id);
    if (!existingBudget) return undefined;

    const updatedBudget: Budget = { ...existingBudget, ...budgetData };
    this.budgets.set(id, updatedBudget);
    return updatedBudget;
  }

  async deleteBudget(id: string): Promise<boolean> {
    return this.budgets.delete(id);
  }

  // Budget items operations
  async getBudgetItems(budgetId: string): Promise<BudgetItem[]> {
    return Array.from(this.budgetItems.values())
      .filter(item => item.budgetId === budgetId);
  }

  async createBudgetItem(insertItem: InsertBudgetItem): Promise<BudgetItem> {
    const id = this.budgetItemId++;
    const item: BudgetItem = { ...insertItem, id };
    this.budgetItems.set(id, item);
    return item;
  }

  // Contact operations
  async getAllContacts(): Promise<(ContactInfo & { budgetId: string })[]> {
    return Array.from(this.contacts.values());
  }

  async getContact(budgetId: string): Promise<(ContactInfo & { budgetId: string }) | undefined> {
    return this.contacts.get(budgetId);
  }

  async createContact(budgetId: string, contact: Omit<InsertContactInfo, 'budgetId'>): Promise<ContactInfo & { budgetId: string }> {
    const newContact = {
      id: Date.now(),
      budgetId,
      ...contact,
    };
    this.contacts.set(budgetId, newContact);
    return newContact;
  }

  async updateContact(budgetId: string, contactData: Partial<Omit<InsertContactInfo, 'budgetId'>>): Promise<(ContactInfo & { budgetId: string }) | undefined> {
    const existingContact = this.contacts.get(budgetId);
    if (!existingContact) return undefined;

    const updatedContact = { ...existingContact, ...contactData };
    this.contacts.set(budgetId, updatedContact);
    return updatedContact;
  }

  // Import operations
  async importCsvData(csvData: string, options: { compareWithPrevious: boolean; autoFinalizeMissing: boolean }): Promise<{ added: number; updated: number; deleted: number; total: number }> {
    try {
      // Parse CSV data into budgets
      const newBudgets = await convertCsvToBudgets(csvData);
      const existingBudgets = Array.from(this.budgets.values());
      
      // Compare with existing budgets
      const compareResult = compareBudgets(existingBudgets, newBudgets, options);
      
      // Process budgets to add or update
      for (const budget of newBudgets) {
        // Check if budget already exists
        const existingBudget = this.budgets.get(budget.id);
        
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
          this.budgetItems = new Map(
            Array.from(this.budgetItems.entries())
              .filter(([_, item]) => item.budgetId !== budget.id)
          );
          
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
              estado: 'Vencido',
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
    return this.importLogs;
  }

  async createImportLog(log: Omit<InsertImportLog, 'id'>): Promise<ImportLog> {
    const id = this.importLogId++;
    const importLog: ImportLog = {
      id,
      timestamp: new Date(),
      ...log,
    };
    this.importLogs.push(importLog);
    return importLog;
  }
}

// Initialize the storage
export const storage = new MemStorage();
