import { z } from 'zod';
import { customers, messages, orders, invoices } from './schema';
const BASE_URL =
  typeof window !== "undefined"
    ? import.meta.env?.VITE_API_URL || ""
    : "";

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  webhook: {
    receive: {
      method: 'POST' as const,
      path: '/webhook' as const,
      input: z.object({
        from: z.string(),
        message: z.string(),
      }),
      responses: {
        200: z.object({ success: z.boolean(), orderCreated: z.boolean() }),
        400: errorSchemas.validation,
      },
    },
  },
  ingestChat: {
    create: {
      method: 'POST' as const,
      path: '/api/ingest-chat' as const,
      input: z.object({
        channel: z.enum(['whatsapp', 'telegram', 'other']).default('other'),
        businessAccount: z.string().min(1),
        senderRole: z.enum(['customer', 'admin']).default('customer'),
        from: z.string().min(3),
        message: z.string().min(1),
      }),
      responses: {
        200: z.object({
          success: z.boolean(),
          orderCreated: z.boolean(),
          confidenceScore: z.number(),
          itemsDetected: z.number(),
        }),
        400: errorSchemas.validation,
      },
    },
  },
  stats: {
    get: {
      method: 'GET' as const,
      path: '/api/stats' as const,
      responses: {
        200: z.object({
          totalRevenue: z.number(),
          totalOrders: z.number(),
          pendingOrders: z.number(),
          recentMessages: z.number(),
        }),
      }
    }
  },
  orders: {
    list: {
      method: 'GET' as const,
      path: '/api/orders' as const,
      responses: {
        200: z.array(z.custom<typeof orders.$inferSelect>()),
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/orders/:id/status' as const,
      input: z.object({ status: z.enum(['pending', 'paid']) }),
      responses: {
        200: z.custom<typeof orders.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  messages: {
    list: {
      method: 'GET' as const,
      path: '/api/messages' as const,
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/messages/:id' as const,
      responses: {
        200: z.object({ success: z.boolean() }),
        404: errorSchemas.notFound,
      },
    },
    deleteAll: {
      method: 'DELETE' as const,
      path: '/api/messages' as const,
      responses: {
        200: z.object({ success: z.boolean(), deleted: z.number() }),
      },
    },
  },
  customers: {
    list: {
      method: 'GET' as const,
      path: '/api/customers' as const,
      responses: {
        200: z.array(z.custom<typeof customers.$inferSelect>()),
      },
    },
  },
  invoices: {
    list: {
      method: 'GET' as const,
      path: '/api/invoices' as const,
      responses: {
        200: z.array(z.custom<typeof invoices.$inferSelect>()),
      },
    },
  },
};

export function buildUrl(
  path: string,
  params?: Record<string, string | number>
): string {
  let url = path;

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }

  return `${BASE_URL}${url}`;
}