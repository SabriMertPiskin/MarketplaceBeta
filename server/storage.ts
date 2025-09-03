import { 
  users, 
  products, 
  orders, 
  messages, 
  notifications, 
  materials,
  type User, 
  type InsertUser, 
  type Product, 
  type InsertProduct, 
  type Order, 
  type InsertOrder, 
  type Message, 
  type InsertMessage, 
  type Notification, 
  type InsertNotification, 
  type Material, 
  type InsertMaterial 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  
  // Products
  getProduct(id: string): Promise<Product | undefined>;
  getProductsByUser(userId: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined>;
  
  // Orders
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByCustomer(customerId: string): Promise<Order[]>;
  getOrdersByProducer(producerId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order | undefined>;
  
  // Messages
  getMessagesByOrder(orderId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Notifications
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  
  // Materials
  getMaterials(): Promise<Material[]>;
  createMaterial(material: InsertMaterial): Promise<Material>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, created_at: new Date(), updated_at: new Date() })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Products
  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductsByUser(userId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.user_id, userId))
      .orderBy(desc(products.created_at));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values({ ...insertProduct, created_at: new Date(), updated_at: new Date() })
      .returning();
    return product;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  // Orders
  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.customer_id, customerId))
      .orderBy(desc(orders.created_at));
  }

  async getOrdersByProducer(producerId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.producer_id, producerId))
      .orderBy(desc(orders.created_at));
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values({ ...insertOrder, created_at: new Date(), updated_at: new Date() })
      .returning();
    return order;
  }

  async updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  // Messages
  async getMessagesByOrder(orderId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.order_id, orderId))
      .orderBy(messages.created_at);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({ ...insertMessage, created_at: new Date() })
      .returning();
    return message;
  }

  // Notifications
  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.user_id, userId))
      .orderBy(desc(notifications.created_at));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values({ ...insertNotification, created_at: new Date() })
      .returning();
    return notification;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ is_read: true })
      .where(eq(notifications.id, id));
  }

  // Materials
  async getMaterials(): Promise<Material[]> {
    return await db
      .select()
      .from(materials)
      .where(eq(materials.is_active, true));
  }

  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const [material] = await db
      .insert(materials)
      .values(insertMaterial)
      .returning();
    return material;
  }
}

export const storage = new DatabaseStorage();
