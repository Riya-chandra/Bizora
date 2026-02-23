import type { Express, Response } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

const liveMessageClients = new Set<Response>();

function broadcastLiveMessageEvent(eventName: string, payload: unknown) {
  const event = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of Array.from(liveMessageClients)) {
    if (client.writableEnded) {
      liveMessageClients.delete(client);
      continue;
    }
    client.write(event);
  }
}

type ParsedItem = { name: string; quantity: number; price: number };

function normalizeProductName(name: string): string {
  return name.toLowerCase().replace(/[^a-z\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function buildDynamicPriceMap(
  existingOrders: Array<{ items: unknown }>,
  savedPrices: Array<{ normalizedName: string; unitPrice: number }>,
): Map<string, number> {
  const dynamicPriceMap = new Map<string, number>();

  for (const savedPrice of savedPrices) {
    if (!savedPrice.normalizedName || savedPrice.unitPrice <= 0) continue;
    dynamicPriceMap.set(savedPrice.normalizedName, savedPrice.unitPrice);
  }

  for (const order of existingOrders) {
    if (!Array.isArray(order.items)) continue;
    for (const rawItem of order.items) {
      if (!rawItem || typeof rawItem !== 'object') continue;
      const item = rawItem as { name?: unknown; price?: unknown };
      if (typeof item.name !== 'string' || typeof item.price !== 'number') continue;
      const normalized = normalizeProductName(item.name);
      if (!normalized || item.price <= 0) continue;
      dynamicPriceMap.set(normalized, item.price);
    }
  }

  return dynamicPriceMap;
}

function extractPriceUpdates(message: string): Array<{ productName: string; unitPrice: number }> {
  const updatesByProduct = new Map<string, number>();

  const pricePatterns = [
    /(\d+)\s+([a-zA-Z\s-]{2,50}?)\s+(\d+)\s*(?:each|per|rs|inr|₹)?/gi,
    /(?:set|update|change)?\s*([a-zA-Z][a-zA-Z\s-]{1,40}?)\s*(?:price)?\s*(?:to|is|=|@|:|for)?\s*(?:₹|rs\.?|inr)?\s*(\d{2,7})\b/gi,
  ];

  for (const pattern of pricePatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(message)) !== null) {
      let productName = '';
      let unitPriceInCents = 0;

      if (match.length >= 4 && /^\d+$/.test(match[1])) {
        productName = match[2]?.trim() || '';
        unitPriceInCents = Number.parseInt(match[3], 10) * 100;
      } else {
        productName = match[1]?.trim() || '';
        unitPriceInCents = Number.parseInt(match[2], 10) * 100;
      }

      const normalizedName = normalizeProductName(productName);
      if (!normalizedName || unitPriceInCents <= 0) continue;
      updatesByProduct.set(normalizedName, unitPriceInCents);
    }
  }

  return Array.from(updatesByProduct.entries()).map(([productName, unitPrice]) => ({
    productName,
    unitPrice,
  }));
}

function resolveDynamicPrice(productName: string, dynamicPriceMap: Map<string, number>): number | undefined {
  const normalized = normalizeProductName(productName);
  const exact = dynamicPriceMap.get(normalized);
  if (exact) return exact;

  for (const entry of Array.from(dynamicPriceMap.entries())) {
    const [key, value] = entry;
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  return undefined;
}

function pushItem(items: ParsedItem[], name: string, quantity: number, price: number) {
  if (!name || quantity <= 0 || price <= 0) return;
  items.push({ name: normalizeProductName(name), quantity, price });
}

function parseChatOrderMessage(
  message: string,
  dynamicPriceMap: Map<string, number>,
): { items: ParsedItem[]; totalAmount: number; confidenceScore: number } {
  const items: ParsedItem[] = [];
  let confidenceScore = 0.1;
  let usedDynamicPrice = false;

  // Examples: "2 saree 1200 each", "3 shirt @ 650", "2 kurti 1200"
  const explicitPricePatterns = [
    /(\d+)\s+([a-zA-Z\s-]{2,50}?)\s+(\d+)\s*(?:each|per|rs|inr)?/gi,
    /(\d+)\s+([a-zA-Z\s-]{2,50}?)\s*@\s*(\d+)/gi,
  ];

  for (const pattern of explicitPricePatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(message)) !== null) {
      const quantity = Number.parseInt(match[1], 10);
      const productName = match[2]?.trim();
      const unitPriceInCents = Number.parseInt(match[3], 10) * 100;
      if (productName && quantity > 0 && unitPriceInCents > 0) {
        pushItem(items, productName, quantity, unitPriceInCents);
        console.log(`[Parser] Explicit: ${quantity}x "${productName}" @ ₹${unitPriceInCents/100}`);
      }
    }
  }

  // Examples: "I order 5 saree", "need 2 kurti and 1 dupatta"
  if (items.length === 0) {
    const segments = message
      .toLowerCase()
      .split(/,|\band\b|\n/)
      .map((part) => part.trim())
      .filter(Boolean);

    for (const segment of segments) {
      const quantityItemMatch = segment.match(/(?:i\s+)?(?:want|need|buy|order|ordered)?\s*(\d+)\s+([a-zA-Z][a-zA-Z\s-]{1,30})/i);
      if (!quantityItemMatch) continue;

      const quantity = Number.parseInt(quantityItemMatch[1], 10);
      const productName = quantityItemMatch[2].trim();
      const dynamicPrice = resolveDynamicPrice(productName, dynamicPriceMap);
      if (!dynamicPrice) {
        console.log(`[Parser] No dynamic price found for: "${productName}"`);
        continue;
      }
      pushItem(items, productName, quantity, dynamicPrice);
      usedDynamicPrice = true;
      console.log(`[Parser] Dynamic: ${quantity}x "${productName}" @ ₹${dynamicPrice/100}`);
    }
  }

  if (items.length > 0) {
    confidenceScore = usedDynamicPrice ? 0.76 : 0.92;
  }

  console.log(`[Parser] Result: ${items.length} items, conf=${confidenceScore.toFixed(2)}, total=₹${(items.reduce((sum, i) => sum + i.quantity * i.price, 0)/100)}`);
  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  return { items, totalAmount, confidenceScore };
}

async function processIncomingMessage(input: {
  from: string;
  message: string;
  channel: 'whatsapp' | 'telegram' | 'other';
  businessAccount: string;
  senderRole: 'customer' | 'admin';
}) {
  const existingOrders = await storage.getOrders();
  const savedPrices = await storage.getProductPrices(input.businessAccount);
  const dynamicPriceMap = buildDynamicPriceMap(existingOrders, savedPrices);

  if (input.senderRole === 'admin') {
    const priceUpdates = extractPriceUpdates(input.message);
    for (const update of priceUpdates) {
      await storage.upsertProductPrice({
        businessAccount: input.businessAccount,
        productName: update.productName,
        normalizedName: normalizeProductName(update.productName),
        unitPrice: update.unitPrice,
      });
      dynamicPriceMap.set(update.productName, update.unitPrice);
      console.log(`[Pricing] Updated ${update.productName} => ₹${update.unitPrice / 100}`);
    }
  }

  const parsed = parseChatOrderMessage(input.message, dynamicPriceMap);

  let customer = await storage.getCustomerByPhone(input.from);
  if (!customer) {
    customer = await storage.createCustomer({ phoneNumber: input.from });
  }

  let orderCreated = false;
  if (input.senderRole === 'customer' && parsed.confidenceScore > 0.5 && parsed.items.length > 0) {
    const order = await storage.createOrder({
      customerId: customer.id,
      totalAmount: parsed.totalAmount,
      items: parsed.items,
      status: 'pending',
    });

    const gstAmount = Math.round(parsed.totalAmount * 0.18);
    await storage.createInvoice({
      orderId: order.id,
      invoiceNumber: `INV-${Date.now()}-${order.id}`,
      totalAmount: parsed.totalAmount + gstAmount,
      gstAmount,
      status: 'issued',
    });
    orderCreated = true;
  }

  await storage.createMessage({
    fromNumber: input.from,
    messageBody: input.message,
    parsedData: {
      items: parsed.items,
      channel: input.channel,
      businessAccount: input.businessAccount,
      senderRole: input.senderRole,
    },
    confidenceScore: parsed.confidenceScore,
    isOrderCreated: orderCreated,
  });

  broadcastLiveMessageEvent('message.ingested', {
    channel: input.channel,
    businessAccount: input.businessAccount,
    senderRole: input.senderRole,
    from: input.from,
    orderCreated,
    itemsDetected: parsed.items.length,
    confidenceScore: parsed.confidenceScore,
    createdAt: Date.now(),
  });

  return {
    success: true,
    orderCreated,
    confidenceScore: parsed.confidenceScore,
    itemsDetected: parsed.items.length,
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get('/api/messages/stream', (_req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    liveMessageClients.add(res);
    res.write(`event: connected\ndata: ${JSON.stringify({ connected: true })}\n\n`);

    const keepAlive = setInterval(() => {
      if (!res.writableEnded) {
        res.write(': keep-alive\n\n');
      }
    }, 25000);

    res.on('close', () => {
      clearInterval(keepAlive);
      liveMessageClients.delete(res);
      res.end();
    });
  });

  app.post(api.webhook.receive.path, async (req, res) => {
    try {
      const input = api.webhook.receive.input.parse(req.body);
      const result = await processIncomingMessage({
        from: input.from,
        message: input.message,
        channel: 'whatsapp',
        businessAccount: 'default-webhook',
        senderRole: 'customer',
      });
      res.status(200).json({ success: result.success, orderCreated: result.orderCreated });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path?.join('.') });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post(api.ingestChat.create.path, async (req, res) => {
    try {
      const input = api.ingestChat.create.input.parse(req.body);
      const result = await processIncomingMessage(input);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path?.join('.') });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Twilio WhatsApp Webhook
  app.post('/api/webhooks/twilio-whatsapp', async (req, res) => {
    try {
      console.log('[Twilio] Incoming webhook:', req.body);
      
      const phoneNumber = req.body.From?.replace('whatsapp:', '') || req.body.From;
      const messageBody = req.body.Body || '';
      
      if (!phoneNumber || !messageBody) {
        console.log('[Twilio] Missing phone or message');
        return res.status(400).send('Missing phone or message');
      }

      const result = await processIncomingMessage({
        from: phoneNumber,
        message: messageBody,
        channel: 'whatsapp',
        businessAccount: 'default',
        senderRole: 'customer',
      });

      console.log('[Twilio] Processing result:', result);

      // Return TwiML response (empty - just acknowledge)
      res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message></Message>
</Response>`);
    } catch (err) {
      console.error('[Twilio] Error:', err);
      res.status(500).send('Error processing message');
    }
  });

  app.get(api.stats.get.path, async (req, res) => {
    const orders = await storage.getOrders();
    const messages = await storage.getMessages();
    
    const totalRevenue = orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const recentMessages = messages.length;

    res.json({ totalRevenue, totalOrders, pendingOrders, recentMessages });
  });

  app.get(api.orders.list.path, async (req, res) => {
    const orders = await storage.getOrders();
    res.json(orders);
  });

  app.patch(api.orders.updateStatus.path, async (req, res) => {
    try {
      const input = api.orders.updateStatus.input.parse(req.body);
      const order = await storage.updateOrderStatus(Number(req.params.id), input.status);
      res.json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(404).json({ message: "Order not found" });
    }
  });

  app.get(api.customers.list.path, async (req, res) => {
    const customers = await storage.getCustomers();
    res.json(customers);
  });

  app.get(api.messages.list.path, async (req, res) => {
    const messages = await storage.getMessages();
    res.json(messages);
  });

  app.delete(api.messages.delete.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteMessage(id);
      if (!success) {
        return res.status(404).json({ message: "Message not found" });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  app.delete(api.messages.deleteAll.path, async (req, res) => {
    try {
      const deleted = await storage.deleteAllMessages();
      res.json({ success: true, deleted });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete messages" });
    }
  });

  app.get(api.invoices.list.path, async (req, res) => {
    const invoices = await storage.getInvoices();
    res.json(invoices);
  });

  // Seed db on startup
  const seed = async () => {
    const existing = await storage.getCustomers();
    if (existing.length === 0) {
      const c1 = await storage.createCustomer({ phoneNumber: '+1234567890', name: 'John Doe' });
      const c2 = await storage.createCustomer({ phoneNumber: '+0987654321', name: 'Jane Smith' });
      
      await storage.createMessage({ fromNumber: '+1234567890', messageBody: '2 red shirts 500 each', parsedData: [{ name: 'red shirts', quantity: 2, price: 50000 }], confidenceScore: 0.9, isOrderCreated: true });
      
      const o1 = await storage.createOrder({ customerId: c1.id, totalAmount: 100000, items: [{ name: 'red shirts', quantity: 2, price: 50000 }], status: 'pending' });
      await storage.createInvoice({ orderId: o1.id, invoiceNumber: 'INV-001', totalAmount: 118000, gstAmount: 18000, status: 'issued' });
    }
  };
  seed().catch(console.error);

  return httpServer;
}