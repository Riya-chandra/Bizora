import { db } from "./db";
import {
  customers, messages, orders, invoices, productPrices,
  type Customer, type InsertCustomer,
  type Message, type InsertMessage,
  type Order, type InsertOrder,
  type Invoice, type InsertInvoice,
  type ProductPrice, type InsertProductPrice
} from "@shared/schema";
import { and, eq, desc, inArray } from "drizzle-orm";

export interface IStorage {
  getCustomers(): Promise<Customer[]>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;

  getMessages(): Promise<Message[]>;
  createMessage(msg: InsertMessage): Promise<Message>;
  deleteMessage(id: number): Promise<boolean>;
  deleteAllMessages(): Promise<number>;
  deleteMessageWithRelated(id: number): Promise<{ messagesDeleted: number; ordersDeleted: number; invoicesDeleted: number }>;

  getOrders(): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order>;

  getInvoices(): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;

  getProductPrices(businessAccount: string): Promise<ProductPrice[]>;
  upsertProductPrice(price: InsertProductPrice): Promise<ProductPrice>;
  deleteProductPrice(id: number, businessAccount: string): Promise<boolean>;
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
  async deleteMessage(id: number): Promise<boolean> {
    const result = await db.delete(messages).where(eq(messages.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  async deleteAllMessages(): Promise<number> {
    const result = await db.delete(messages);
    return result.rowCount ?? 0;
  }
  async deleteMessageWithRelated(id: number): Promise<{ messagesDeleted: number; ordersDeleted: number; invoicesDeleted: number }> {
    // Get orders related to this message
    const msg = await db.select().from(messages).where(eq(messages.id, id));
    if (!msg[0]) return { messagesDeleted: 0, ordersDeleted: 0, invoicesDeleted: 0 };

    // Find orders created around the same time from same customer
    const msgTime = msg[0].createdAt;
    const relatedOrders = await db
      .select()
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .where(eq(customers.phoneNumber, (msg[0].parsedData as any)?.fromNumber || ''))
      .then((rows) => rows.filter((r) => {
        const timeDiff = Math.abs((r.orders.createdAt?.getTime() || 0) - (msgTime?.getTime() || 0));
        return timeDiff < 60000; // Within 60 seconds
      }));

    const orderIds = relatedOrders.map((r) => r.orders.id);

    let invoicesDeleted = 0;
    let ordersDeleted = 0;

    // Delete invoices for these orders
    if (orderIds.length > 0) {
      const invResult = await db
        .delete(invoices)
        .where(inArray(invoices.orderId, orderIds));
      invoicesDeleted = (invResult.rowCount ?? 0);

      // Delete the orders
      const ordResult = await db
        .delete(orders)
        .where(inArray(orders.id, orderIds));
      ordersDeleted = (ordResult.rowCount ?? 0);
    }

    // Delete the message
    const msgResult = await db.delete(messages).where(eq(messages.id, id));
    const messagesDeleted = (msgResult.rowCount ?? 0);

    return { messagesDeleted, ordersDeleted, invoicesDeleted };
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

  async getProductPrices(businessAccount: string): Promise<ProductPrice[]> {
    return await db
      .select()
      .from(productPrices)
      .where(eq(productPrices.businessAccount, businessAccount))
      .orderBy(desc(productPrices.updatedAt));
  }

  async upsertProductPrice(price: InsertProductPrice): Promise<ProductPrice> {
    const [row] = await db
      .insert(productPrices)
      .values(price)
      .onConflictDoUpdate({
        target: [productPrices.businessAccount, productPrices.normalizedName],
        set: {
          productName: price.productName,
          unitPrice: price.unitPrice,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row;
  }

  async deleteProductPrice(id: number, businessAccount: string): Promise<boolean> {
    const result = await db
      .delete(productPrices)
      .where(and(eq(productPrices.id, id), eq(productPrices.businessAccount, businessAccount)));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();