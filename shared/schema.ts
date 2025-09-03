import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, decimal, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("customer"), // customer, producer, admin
  phone: text("phone"),
  address: text("address"),
  kvkk_consent: boolean("kvkk_consent").default(false),
  kvkk_consent_date: timestamp("kvkk_consent_date"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  last_login: timestamp("last_login"),
  is_active: boolean("is_active").default(true),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  stl_file_url: text("stl_file_url"),
  ipfs_hash: text("ipfs_hash"),
  analysis: jsonb("analysis"), // STL analysis data
  status: text("status").default("draft"), // draft, pending, approved, rejected
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customer_id: varchar("customer_id").notNull().references(() => users.id),
  producer_id: varchar("producer_id").references(() => users.id),
  product_id: varchar("product_id").notNull().references(() => products.id),
  status: text("status").default("draft"),
  quantity: integer("quantity").default(1),
  material_type: text("material_type"),
  pricing_data: jsonb("pricing_data"),
  customer_price: decimal("customer_price", { precision: 10, scale: 2 }),
  producer_earnings: decimal("producer_earnings", { precision: 10, scale: 2 }),
  platform_commission: decimal("platform_commission", { precision: 10, scale: 2 }),
  payment_fee: decimal("payment_fee", { precision: 10, scale: 2 }),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  accepted_at: timestamp("accepted_at"),
  paid_at: timestamp("paid_at"),
  completed_at: timestamp("completed_at"),
  cancelled_at: timestamp("cancelled_at"),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  order_id: varchar("order_id").notNull().references(() => orders.id),
  sender_id: varchar("sender_id").notNull().references(() => users.id),
  receiver_id: varchar("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  is_read: boolean("is_read").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  order_id: varchar("order_id").references(() => orders.id),
  is_read: boolean("is_read").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const materials = pgTable("materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // PLA, ABS, PETG, TPU
  price_per_gram: decimal("price_per_gram", { precision: 6, scale: 4 }),
  density: decimal("density", { precision: 4, scale: 2 }),
  properties: jsonb("properties"),
  is_active: boolean("is_active").default(true),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  created_at: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  created_at: true,
});

export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
