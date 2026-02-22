import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useMessages() {
  return useQuery({
    queryKey: [api.messages.list.path],
    queryFn: async () => {
      const res = await fetch(api.messages.list.path);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return api.messages.list.responses[200].parse(await res.json());
    },
    // Faster polling so the log updates quickly while demoing
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}

export function useIngestChatMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: {
      channel: 'whatsapp' | 'telegram' | 'other';
      businessAccount: string;
      senderRole: 'customer' | 'admin';
      from: string;
      message: string;
    }) => {
      const res = await fetch(api.ingestChat.create.path, {
        method: api.ingestChat.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Failed to ingest chat message");
      }

      return api.ingestChat.create.responses[200].parse(await res.json());
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.orders.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.customers.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.invoices.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });

      toast({
        title: result.orderCreated ? "Order captured" : "Message logged",
        description: `${result.itemsDetected} item(s) detected · Confidence ${Math.round(result.confidenceScore * 100)}%`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ingest failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
