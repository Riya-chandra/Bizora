import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Overview from "@/pages/Overview";
import Orders from "@/pages/Orders";
import Customers from "@/pages/Customers";
import Invoices from "@/pages/Invoices";
import Messages from "@/pages/Messages";
import Products from "@/pages/Products";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Overview} />
      <Route path="/orders" component={Orders} />
      <Route path="/customers" component={Customers} />
      <Route path="/products" component={Products} />
      <Route path="/invoices" component={Invoices} />
      <Route path="/messages" component={Messages} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
