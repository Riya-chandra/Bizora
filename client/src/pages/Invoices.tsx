import { DashboardLayout } from "@/components/DashboardLayout";
import { useInvoices } from "@/hooks/use-invoices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AmountDisplay } from "@/components/AmountDisplay";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Invoices() {
  const { data: invoices, isLoading } = useInvoices();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">Generated invoices and billing status.</p>
        </div>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>All Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : invoices?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No invoices generated yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Order Ref</TableHead>
                    <TableHead>Date Issued</TableHead>
                    <TableHead>GST Amount</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Download</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices?.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell className="text-muted-foreground">#{invoice.orderId}</TableCell>
                      <TableCell>
                        {invoice.createdAt ? format(new Date(invoice.createdAt), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <AmountDisplay amountInCents={invoice.gstAmount} />
                      </TableCell>
                      <TableCell className="font-bold">
                        <AmountDisplay amountInCents={invoice.totalAmount} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={invoice.status} variant="outline" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <FileText className="h-4 w-4" />
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
