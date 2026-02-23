import { pgTable, text, serial, integer, boolean, timestamp, real, json, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  fromNumber: text("from_number").notNull(),
  messageBody: text("message_body").notNull(),
  parsedData: json("parsed_data"), // { items: [{ name, quantity, price }] }
  confidenceScore: real("confidence_score").notNull(),
  isOrderCreated: boolean("is_order_created").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  totalAmount: integer("total_amount").notNull(), // in cents
  status: text("status").notNull().default('pending'), // 'pending', 'paid'
  items: json("items").notNull(), // [{ name, quantity, price }]
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  totalAmount: integer("total_amount").notNull(), // in cents
  gstAmount: integer("gst_amount").notNull().default(0), // in cents
  status: text("status").notNull().default('issued'), // 'issued', 'paid'
  createdAt: timestamp("created_at").defaultNow(),
});

export const productPrices = pgTable("product_prices", {
  id: serial("id").primaryKey(),
  businessAccount: text("business_account").notNull(),
  productName: text("product_name").notNull(),
  normalizedName: text("normalized_name").notNull(),
  unitPrice: integer("unit_price").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  businessProductUnique: uniqueIndex("product_prices_business_normalized_unique").on(table.businessAccount, table.normalizedName),
}));

export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
export const insertProductPriceSchema = createInsertSchema(productPrices).omit({ id: true, createdAt: true, updatedAt: true });

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type ProductPrice = typeof productPrices.$inferSelect;
export type InsertProductPrice = z.infer<typeof insertProductPriceSchema>;
