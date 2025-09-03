import { Package, Clock, RussianRuble, MessageCircle, Box } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/orders/order-timeline";
import { formatTRY, formatDate } from "@/utils/format";
import { DashboardStats, Order } from "@/types";

interface CustomerDashboardProps {
  stats?: DashboardStats;
  recentOrders?: Order[];
  onNavigate: (section: string) => void;
}

export default function CustomerDashboard({ 
  stats = {}, 
  recentOrders = [], 
  onNavigate 
}: CustomerDashboardProps) {
  // Mock data for demonstration - replace with real data
  const mockStats: DashboardStats = {
    total_orders: 12,
    active_orders: 3,
    total_spent: 847.50,
    messages: 5,
    ...stats,
  };

  const mockRecentOrders: Order[] = recentOrders.length > 0 ? recentOrders : [
    {
      id: "ORD-2024-001",
      customer_id: "user1",
      product_id: "prod1",
      status: "in_production",
      quantity: 1,
      customer_price: 45.00,
      created_at: "2024-01-15T14:30:00Z",
      updated_at: "2024-01-15T14:30:00Z",
      product: {
        id: "prod1",
        user_id: "user1",
        name: "Telefon Kılıfı",
        status: "approved",
        created_at: "2024-01-15T14:30:00Z",
        updated_at: "2024-01-15T14:30:00Z",
      },
      producer: {
        id: "producer1",
        email: "mehmet@example.com",
        name: "Mehmet Özkan",
        role: "producer" as const,
        kvkk_consent: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        is_active: true,
      },
    },
    {
      id: "ORD-2024-002",
      customer_id: "user1",
      product_id: "prod2",
      status: "confirmed",
      quantity: 1,
      customer_price: 25.50,
      created_at: "2024-01-12T09:15:00Z",
      updated_at: "2024-01-12T09:15:00Z",
      product: {
        id: "prod2",
        user_id: "user1",
        name: "Anahtarlık",
        status: "approved",
        created_at: "2024-01-12T09:15:00Z",
        updated_at: "2024-01-12T09:15:00Z",
      },
      producer: {
        id: "producer2",
        email: "ayse@example.com",
        name: "Ayşe Demir",
        role: "producer" as const,
        kvkk_consent: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        is_active: true,
      },
    },
  ];

  return (
    <div className="space-y-8" data-testid="customer-dashboard">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-card-foreground mb-2">Hoş Geldiniz!</h2>
        <p className="text-muted-foreground">3D baskı siparişlerinizi yönetin ve yeni projeler oluşturun.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Toplam Sipariş</p>
                <p className="text-2xl font-bold text-card-foreground" data-testid="stat-total-orders">
                  {mockStats.total_orders}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aktif Sipariş</p>
                <p className="text-2xl font-bold text-card-foreground" data-testid="stat-active-orders">
                  {mockStats.active_orders}
                </p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Toplam Harcama</p>
                <p className="text-2xl font-bold text-card-foreground" data-testid="stat-total-spent">
                  {formatTRY(mockStats.total_spent || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                <RussianRuble className="w-6 h-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mesaj</p>
                <p className="text-2xl font-bold text-card-foreground" data-testid="stat-messages">
                  {mockStats.messages}
                </p>
              </div>
              <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-card-foreground">Son Siparişler</CardTitle>
        </CardHeader>
        <CardContent>
          {mockRecentOrders.length === 0 ? (
            <div className="text-center py-8">
              <Box className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Henüz sipariş bulunmuyor</p>
              <Button 
                onClick={() => onNavigate("upload")} 
                className="mt-4"
                data-testid="button-create-first-order"
              >
                İlk Siparişinizi Oluşturun
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {mockRecentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  data-testid={`order-item-${order.id}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Box className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground" data-testid={`order-name-${order.id}`}>
                        {order.product?.name}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`order-date-${order.id}`}>
                        {formatDate(order.created_at, true)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <OrderStatusBadge status={order.status} data-testid={`order-status-${order.id}`} />
                    <span className="font-medium text-card-foreground" data-testid={`order-price-${order.id}`}>
                      {formatTRY(order.customer_price || 0)}
                    </span>
                  </div>
                </div>
              ))}
              
              <div className="pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => onNavigate("orders")}
                  className="w-full"
                  data-testid="button-view-all-orders"
                >
                  Tüm Siparişleri Görüntüle
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
