import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Factory } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/shared/header";
import { PageLoader } from "@/components/shared/loading-spinner";
import ProducerDashboard from "@/pages/producer/dashboard";
import ProducerOrders from "@/pages/producer/orders";
import ProducerSettings from "@/pages/producer/settings";

export default function ProducerLayout() {
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

  if (user.role !== "producer") {
    navigate("/login");
    return null;
  }

  const navigation = [
    { label: "Panel", section: "dashboard", active: activeSection === "dashboard" },
    { label: "Siparişler", section: "orders", active: activeSection === "orders" },
    { label: "Ayarlar", section: "settings", active: activeSection === "settings" },
  ];

  const handleNavigate = (section: string) => {
    setActiveSection(section);
    navigate(`/producer/${section}`);
  };

  return (
    <div className="min-h-screen bg-background" data-testid="producer-layout">
      <Header
        title="Üretici Paneli"
        icon={<Factory className="w-5 h-5 text-secondary-foreground" />}
        navigation={navigation}
        onNavigate={handleNavigate}
        color="secondary"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Switch>
          <Route path="/producer/orders">
            <ProducerOrders />
          </Route>
          <Route path="/producer/settings">
            <ProducerSettings />
          </Route>
          <Route path="/producer/:section?" params={{ section: activeSection }}>
            <ProducerDashboard />
          </Route>
        </Switch>
      </main>
    </div>
  );
}
