import { Package, RussianRuble, Star, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/orders/order-timeline";
import { formatTRY, formatDate } from "@/utils/format";
import { DashboardStats, Order } from "@/types";

interface ProducerDashboardProps {
  stats?: DashboardStats;
  pendingOrders?: Order[];
}

export default function ProducerDashboard({ 
  stats = {}, 
  pendingOrders = [] 
}: ProducerDashboardProps) {
  const mockStats: DashboardStats = {
    active_orders: 8,
    total_earnings: 1245.00,
    rating: 4.8,
    completed_orders: 156,
    ...stats,
  };

  const mockPendingOrders: Order[] = pendingOrders.length > 0 ? pendingOrders : [
    {
      id: "ORD-2024-003",
      customer_id: "customer1",
      product_id: "prod3",
      status: "pending",
      quantity: 1,
      customer_price: 65.00,
      created_at: "2024-01-16T10:20:00Z",
      updated_at: "2024-01-16T10:20:00Z",
      product: {
        id: "prod3",
        user_id: "customer1",
        name: "Telefon Stand",
        status: "approved",
        created_at: "2024-01-16T10:20:00Z",
        updated_at: "2024-01-16T10:20:00Z",
      },
      customer: {
        id: "customer1",
        email: "ayse@example.com",
        name: "Ayşe Yılmaz",
        role: "customer" as const,
        kvkk_consent: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        is_active: true,
      },
    },
  ];

  const handleAcceptOrder = async (orderId: string) => {
    try {
      // TODO: Implement order acceptance API call
      console.log("Accepting order:", orderId);
    } catch (error) {
      console.error("Failed to accept order:", error);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      // TODO: Implement order rejection API call
      console.log("Rejecting order:", orderId);
    } catch (error) {
      console.error("Failed to reject order:", error);
    }
  };

  return (
    <div className="space-y-8" data-testid="producer-dashboard">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-card-foreground mb-2">Üretici Paneli</h2>
        <p className="text-muted-foreground">Siparişlerinizi yönetin ve kazançlarınızı takip edin.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <Package className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bu Ay Kazanç</p>
                <p className="text-2xl font-bold text-card-foreground" data-testid="stat-earnings">
                  {formatTRY(mockStats.total_earnings || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <RussianRuble className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Değerlendirme</p>
                <p className="text-2xl font-bold text-card-foreground" data-testid="stat-rating">
                  {mockStats.rating}
                </p>
              </div>
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tamamlanan</p>
                <p className="text-2xl font-bold text-card-foreground" data-testid="stat-completed">
                  {mockStats.completed_orders}
                </p>
              </div>
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-card-foreground">Bekleyen Siparişler</CardTitle>
        </CardHeader>
        <CardContent>
          {mockPendingOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Bekleyen sipariş bulunmuyor</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mockPendingOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  data-testid={`pending-order-${order.id}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground" data-testid={`order-name-${order.id}`}>
                        {order.product?.name}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`customer-name-${order.id}`}>
                        Müşteri: {order.customer?.name}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`order-date-${order.id}`}>
                        {formatDate(order.created_at, true)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <OrderStatusBadge status={order.status} />
                    <span className="font-medium text-card-foreground" data-testid={`order-price-${order.id}`}>
                      {formatTRY(order.customer_price || 0)}
                    </span>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejectOrder(order.id)}
                        data-testid={`button-reject-${order.id}`}
                      >
                        Reddet
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAcceptOrder(order.id)}
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        data-testid={`button-accept-${order.id}`}
                      >
                        Onayla
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
