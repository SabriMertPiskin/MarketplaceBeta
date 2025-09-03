import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Box, Upload, Package, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/shared/header";
import { PageLoader } from "@/components/shared/loading-spinner";
import CustomerDashboard from "@/pages/customer/dashboard";
import UploadPage from "@/pages/customer/upload";
import CustomerOrders from "@/pages/customer/orders";
import CustomerMessages from "@/pages/customer/messages";

export default function CustomerLayout() {
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

  if (user.role !== "customer") {
    navigate("/login");
    return null;
  }

  const navigation = [
    { label: "Panel", section: "dashboard", active: activeSection === "dashboard" },
    { label: "Dosya Yükle", section: "upload", active: activeSection === "upload" },
    { label: "Siparişlerim", section: "orders", active: activeSection === "orders" },
    { label: "Mesajlar", section: "messages", active: activeSection === "messages" },
  ];

  const handleNavigate = (section: string) => {
    setActiveSection(section);
    navigate(`/dashboard/${section}`);
  };

  return (
    <div className="min-h-screen bg-background" data-testid="customer-layout">
      <Header
        title="3D Baskı Pazaryeri"
        icon={<Box className="w-5 h-5 text-primary-foreground" />}
        navigation={navigation}
        onNavigate={handleNavigate}
        color="primary"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Switch>
          <Route path="/dashboard/upload">
            <UploadPage />
          </Route>
          <Route path="/dashboard/orders">
            <CustomerOrders onNavigate={handleNavigate} />
          </Route>
          <Route path="/dashboard/messages">
            <CustomerMessages />
          </Route>
          <Route path="/dashboard/:section?" params={{ section: activeSection }}>
            <CustomerDashboard onNavigate={handleNavigate} />
          </Route>
        </Switch>
      </main>
    </div>
  );
}
