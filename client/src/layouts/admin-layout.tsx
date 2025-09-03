import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/shared/header";
import { PageLoader } from "@/components/shared/loading-spinner";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminOrders from "@/pages/admin/orders";
import AdminAnalytics from "@/pages/admin/analytics";

export default function AdminLayout() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [location, navigate] = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  if (user.role !== "admin") {
    navigate("/login");
    return null;
  }

  const navigation = [
    { label: "Panel", section: "dashboard", active: activeSection === "dashboard" },
    { label: "Kullanıcılar", section: "users", active: activeSection === "users" },
    { label: "Siparişler", section: "orders", active: activeSection === "orders" },
    { label: "Analitik", section: "analytics", active: activeSection === "analytics" },
  ];

  const handleNavigate = (section: string) => {
    setActiveSection(section);
    navigate(`/admin/${section}`);
  };

  return (
    <div className="min-h-screen bg-background" data-testid="admin-layout">
      <Header
        title="Admin Paneli"
        icon={<Shield className="w-5 h-5 text-destructive-foreground" />}
        navigation={navigation}
        onNavigate={handleNavigate}
        color="destructive"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Switch>
          <Route path="/admin/users">
            <AdminUsers />
          </Route>
          <Route path="/admin/orders">
            <AdminOrders />
          </Route>
          <Route path="/admin/analytics">
            <AdminAnalytics />
          </Route>
          <Route path="/admin/:section?" params={{ section: activeSection }}>
            <AdminDashboard />
          </Route>
        </Switch>
      </main>
    </div>
  );
}
