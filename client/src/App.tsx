import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/auth/login";
import CustomerLayout from "@/layouts/customer-layout";
import ProducerLayout from "@/layouts/producer-layout";
import AdminLayout from "@/layouts/admin-layout";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/dashboard" nest>
        <CustomerLayout />
      </Route>
      <Route path="/producer" nest>
        <ProducerLayout />
      </Route>
      <Route path="/admin" nest>
        <AdminLayout />
      </Route>
      <Route path="/">
        <LoginPage />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
