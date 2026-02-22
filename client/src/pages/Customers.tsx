import { DashboardLayout } from "@/components/DashboardLayout";
import { useCustomers } from "@/hooks/use-customers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

export default function Customers() {
  const { data: customers, isLoading } = useCustomers();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-1">Directory of customers from WhatsApp.</p>
        </div>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Customer List</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : customers?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No customers found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Avatar</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>First Seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers?.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <Avatar className="h-9 w-9 bg-secondary text-secondary-foreground">
                          <AvatarFallback>
                            {customer.name ? customer.name.substring(0, 2).toUpperCase() : 'CN'}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{customer.phoneNumber}</TableCell>
                      <TableCell className="font-medium">{customer.name || 'Unknown'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {customer.createdAt ? format(new Date(customer.createdAt), 'MMM d, yyyy') : '-'}
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
