import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AmountDisplay } from "@/components/AmountDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteProductPrice, useProductPrices, useUpsertProductPrice } from "@/hooks/use-product-prices";

export default function Products() {
  const [businessAccount, setBusinessAccount] = useState("default");
  const [productName, setProductName] = useState("");
  const [unitPrice, setUnitPrice] = useState("");

  const normalizedBusiness = useMemo(() => businessAccount.trim() || "default", [businessAccount]);
  const { data: products, isLoading } = useProductPrices(normalizedBusiness);
  const upsertProduct = useUpsertProductPrice();
  const deleteProduct = useDeleteProductPrice();

  const onSave = () => {
    const rupees = Number.parseFloat(unitPrice);
    if (!productName.trim() || !Number.isFinite(rupees) || rupees <= 0) return;

    upsertProduct.mutate({
      businessAccount: normalizedBusiness,
      productName: productName.trim(),
      unitPriceRupees: rupees,
    });

    setProductName("");
    setUnitPrice("");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products & Pricing</h1>
          <p className="text-muted-foreground mt-1">Manage product catalog so order parsing, price updates, and totals stay accurate.</p>
        </div>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Add or Update Product Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <Input
                placeholder="Business account (default)"
                value={businessAccount}
                onChange={(event) => setBusinessAccount(event.target.value)}
              />
              <Input
                placeholder="Product name (e.g., clay pot)"
                value={productName}
                onChange={(event) => setProductName(event.target.value)}
              />
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Unit price in rupees"
                value={unitPrice}
                onChange={(event) => setUnitPrice(event.target.value)}
              />
              <Button onClick={onSave} disabled={upsertProduct.isPending}>
                Save Product
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Catalog Items</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : !products?.length ? (
              <div className="text-center py-10 text-muted-foreground">No products added yet for this business account.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Normalized Key</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>#{product.id}</TableCell>
                      <TableCell className="font-medium">{product.productName}</TableCell>
                      <TableCell className="text-muted-foreground">{product.normalizedName}</TableCell>
                      <TableCell><AmountDisplay amountInCents={product.unitPrice} /></TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteProduct.mutate({ id: product.id, businessAccount: normalizedBusiness })}
                          disabled={deleteProduct.isPending}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
