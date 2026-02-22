import { DashboardLayout } from "@/components/DashboardLayout";
import { useStats } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingBag, Clock, Activity } from "lucide-react";
import { AmountDisplay } from "@/components/AmountDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// Mock data for the chart since we don't have historical stats API yet
const chartData = [
  { name: 'Mon', total: 40000 },
  { name: 'Tue', total: 30000 },
  { name: 'Wed', total: 20000 },
  { name: 'Thu', total: 27800 },
  { name: 'Fri', total: 18900 },
  { name: 'Sat', total: 23900 },
  { name: 'Sun', total: 34900 },
];

export default function Overview() {
  const { data: stats, isLoading } = useStats();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Overview of your business performance today.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Total Revenue" 
            value={stats?.totalRevenue} 
            loading={isLoading}
            icon={DollarSign}
            isCurrency
          />
          <StatCard 
            title="Total Orders" 
            value={stats?.totalOrders} 
            loading={isLoading}
            icon={ShoppingBag}
          />
          <StatCard 
            title="Pending Orders" 
            value={stats?.pendingOrders} 
            loading={isLoading}
            icon={Clock}
          />
          <StatCard 
            title="Recent Messages" 
            value={stats?.recentMessages} 
            loading={isLoading}
            icon={Activity}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-7">
          <Card className="col-span-4 bg-card shadow-sm border-border/50">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `₹${value/100}`} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`₹${value/100}`, 'Revenue']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorTotal)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-3 bg-gradient-to-br from-primary/90 to-primary text-primary-foreground shadow-lg shadow-primary/20">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                  <h3 className="font-semibold text-lg">System Active</h3>
                  <p className="text-primary-foreground/80 text-sm mt-1">
                    WhatsApp webhook is listening for new orders.
                  </p>
                </div>
                <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                  <h3 className="font-semibold text-lg">Confidence Score</h3>
                  <p className="text-primary-foreground/80 text-sm mt-1">
                    AI Parsing is running with high accuracy.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, loading, icon: Icon, isCurrency = false }: any) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <div className="text-2xl font-bold">
            {isCurrency ? <AmountDisplay amountInCents={value || 0} /> : (value || 0)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
