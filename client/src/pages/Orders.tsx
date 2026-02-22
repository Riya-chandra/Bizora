import { DashboardLayout } from "@/components/DashboardLayout";
import { useOrders, useUpdateOrderStatus } from "@/hooks/use-orders";
import { useCustomers } from "@/hooks/use-customers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { AmountDisplay } from "@/components/AmountDisplay";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock } from "lucide-react";

export default function Orders() {
  const { data: orders, isLoading } = useOrders();
  const { data: customers } = useCustomers();
  const updateStatus = useUpdateOrderStatus();
  const customerById = new Map(customers?.map((customer) => [customer.id, customer.phoneNumber]) ?? []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
            <p className="text-muted-foreground mt-1">Manage incoming WhatsApp orders.</p>
          </div>
        </div>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : orders?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No orders found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer Phone</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders?.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell className="font-mono text-sm">{customerById.get(order.customerId) || `#${order.customerId}`}</TableCell>
                      <TableCell>{order.createdAt ? format(new Date(order.createdAt), 'MMM d, yyyy') : '-'}</TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {Array.isArray(order.items) 
                            ? order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ') 
                            : 'No items'}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        <AmountDisplay amountInCents={order.totalAmount} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {order.status === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 gap-2 border-emerald-200 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 hover:border-emerald-300"
                            onClick={() => updateStatus.mutate({ id: order.id, status: 'paid' })}
                            disabled={updateStatus.isPending}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark Paid
                          </Button>
                        )}
                        {order.status === 'paid' && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 gap-2 text-muted-foreground"
                            onClick={() => updateStatus.mutate({ id: order.id, status: 'pending' })}
                            disabled={updateStatus.isPending}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            Revert
                          </Button>
                        )}
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
