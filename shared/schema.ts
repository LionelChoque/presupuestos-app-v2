import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const budgetItems = pgTable("budget_items", {
  id: serial("id").primaryKey(),
  budgetId: text("budget_id").notNull(),
  codigo: text("codigo"),
  descripcion: text("descripcion").notNull(),
  precio: integer("precio").notNull(),
  cantidad: integer("cantidad").default(1),
});

export const budgets = pgTable("budgets", {
  id: text("id").primaryKey(),
  empresa: text("empresa").notNull(),
  fechaCreacion: text("fecha_creacion").notNull(),
  fabricante: text("fabricante").notNull(),
  moneda: text("moneda").default("Dólar EEUU"),
  descuento: integer("descuento").default(0),
  validez: integer("validez").default(0),
  montoTotal: integer("monto_total").notNull(),
  diasTranscurridos: integer("dias_transcurridos").default(0),
  diasRestantes: integer("dias_restantes").default(0),
  tipoSeguimiento: text("tipo_seguimiento").notNull(),
  accion: text("accion").notNull(),
  prioridad: text("prioridad").notNull(),
  alertas: jsonb("alertas").$type<string[]>().default([]),
  completado: boolean("completado").default(false),
  estado: text("estado").default("Pendiente"),
  notas: text("notas").default(""),
  finalizado: boolean("finalizado").default(false),
});

export const contactInfo = pgTable("contact_info", {
  id: serial("id").primaryKey(),
  budgetId: text("budget_id").notNull().unique(),
  nombre: text("nombre").notNull(),
  email: text("email"),
  telefono: text("telefono"),
});

export const importLogs = pgTable("import_logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  fileName: text("file_name").notNull(),
  recordsImported: integer("records_imported").notNull(),
  recordsUpdated: integer("records_updated").default(0),
  recordsDeleted: integer("records_deleted").default(0),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBudgetItemSchema = createInsertSchema(budgetItems).omit({
  id: true,
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
});

export const insertContactInfoSchema = createInsertSchema(contactInfo).omit({
  id: true,
});

export const insertImportLogSchema = createInsertSchema(importLogs).omit({
  id: true,
  timestamp: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBudgetItem = z.infer<typeof insertBudgetItemSchema>;
export type BudgetItem = typeof budgetItems.$inferSelect;

export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;

export type InsertContactInfo = z.infer<typeof insertContactInfoSchema>;
export type ContactInfo = typeof contactInfo.$inferSelect;

export type InsertImportLog = z.infer<typeof insertImportLogSchema>;
export type ImportLog = typeof importLogs.$inferSelect;
