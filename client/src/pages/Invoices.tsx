import { DashboardLayout } from "@/components/DashboardLayout";
import { useInvoices } from "@/hooks/use-invoices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AmountDisplay } from "@/components/AmountDisplay";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Fragment, useState } from "react";
import type { Invoice } from "@shared/schema";

export default function Invoices() {
  const { data: invoices, isLoading, isError, error, refetch, isFetching } = useInvoices();
  const [openInvoiceId, setOpenInvoiceId] = useState<number | null>(null);

  const toggleInvoiceRow = (invoiceId: number) => {
    setOpenInvoiceId((current) => (current === invoiceId ? null : invoiceId));
  };

  const downloadInvoice = (invoice: Invoice) => {
    // Open PDF invoice in new window for printing/saving
    window.open(`/api/invoices/${invoice.id}/pdf`, '_blank');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <div className="mt-1 flex items-center gap-3 text-muted-foreground">
            <p>Generated invoices and billing status.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              Refresh
            </Button>
          </div>
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
            ) : isError ? (
              <div className="text-center py-12 text-destructive">
                {error instanceof Error ? error.message : 'Failed to load invoices'}
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices?.map((invoice) => {
                    const isOpen = openInvoiceId === invoice.id;
                    const subtotal = invoice.totalAmount - invoice.gstAmount;

                    return (
                      <Fragment key={invoice.id}>
                        <TableRow>
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
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => downloadInvoice(invoice)}
                                aria-label={`Download ${invoice.invoiceNumber}`}
                                title="Download Invoice"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => toggleInvoiceRow(invoice.id)}
                                aria-label={`${isOpen ? 'Close' : 'Open'} ${invoice.invoiceNumber}`}
                                title={isOpen ? 'Close Details' : 'Open Details'}
                              >
                                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isOpen ? (
                          <TableRow key={`details-${invoice.id}`}>
                            <TableCell colSpan={7}>
                              <div className="rounded-md border bg-secondary/30 p-4 text-sm">
                                <div className="grid gap-2 md:grid-cols-2">
                                  <div>
                                    <p className="text-muted-foreground">Invoice</p>
                                    <p className="font-medium">{invoice.invoiceNumber}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Order Reference</p>
                                    <p className="font-medium">#{invoice.orderId}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Subtotal</p>
                                    <p className="font-medium"><AmountDisplay amountInCents={subtotal} /></p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">GST</p>
                                    <p className="font-medium"><AmountDisplay amountInCents={invoice.gstAmount} /></p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Total</p>
                                    <p className="font-bold"><AmountDisplay amountInCents={invoice.totalAmount} /></p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Status</p>
                                    <div className="mt-1"><StatusBadge status={invoice.status} variant="outline" /></div>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
