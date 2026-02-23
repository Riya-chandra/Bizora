import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_BUSINESS = "default";

export function useProductPrices(businessAccount = DEFAULT_BUSINESS) {
  return useQuery({
    queryKey: [api.productPrices.list.path, businessAccount],
    queryFn: async () => {
      const url = `${buildUrl(api.productPrices.list.path)}?businessAccount=${encodeURIComponent(businessAccount)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch product prices");
      return api.productPrices.list.responses[200].parse(await res.json());
    },
  });
}

export function useUpsertProductPrice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: { businessAccount: string; productName: string; unitPriceRupees: number }) => {
      const res = await fetch(buildUrl(api.productPrices.upsert.path), {
        method: api.productPrices.upsert.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessAccount: payload.businessAccount,
          productName: payload.productName,
          unitPrice: Math.round(payload.unitPriceRupees * 100),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Failed to save product");
      }

      return api.productPrices.upsert.responses[200].parse(await res.json());
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [api.productPrices.list.path, result.businessAccount] });
      toast({ title: "Product saved", description: `${result.productName} updated successfully.` });
    },
    onError: (error: Error) => {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteProductPrice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, businessAccount }: { id: number; businessAccount: string }) => {
      const url = `${buildUrl(api.productPrices.delete.path, { id })}?businessAccount=${encodeURIComponent(businessAccount)}`;
      const res = await fetch(url, { method: api.productPrices.delete.method });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Failed to delete product");
      }
      return api.productPrices.delete.responses[200].parse(await res.json());
    },
    onSuccess: (_result, vars) => {
      queryClient.invalidateQueries({ queryKey: [api.productPrices.list.path, vars.businessAccount] });
      toast({ title: "Product deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    },
  });
}
