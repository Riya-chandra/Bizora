import { db } from "./db";
import {
  customers, messages, orders, invoices,
  type Customer, type InsertCustomer,
  type Message, type InsertMessage,
  type Order, type InsertOrder,
  type Invoice, type InsertInvoice
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getCustomers(): Promise<Customer[]>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;

  getMessages(): Promise<Message[]>;
  createMessage(msg: InsertMessage): Promise<Message>;

  getOrders(): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order>;

  getInvoices(): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
}

export class DatabaseStorage implements IStorage {
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }
  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const [c] = await db.select().from(customers).where(eq(customers.phoneNumber, phone));
    return c;
  }
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [c] = await db.insert(customers).values(customer).returning();
    return c;
  }

  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(desc(messages.createdAt));
  }
  async createMessage(msg: InsertMessage): Promise<Message> {
    const [m] = await db.insert(messages).values(msg).returning();
    return m;
  }

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }
  async createOrder(order: InsertOrder): Promise<Order> {
    const [o] = await db.insert(orders).values(order).returning();
    return o;
  }
  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [o] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return o;
  }

  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [i] = await db.insert(invoices).values(invoice).returning();
    return i;
  }
}

export const storage = new DatabaseStorage();