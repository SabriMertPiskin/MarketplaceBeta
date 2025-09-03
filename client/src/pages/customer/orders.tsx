import { useState } from "react";
import { Box, Star, MessageCircle, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderStatusBadge, OrderTimeline } from "@/components/orders/order-timeline";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatTRY, formatDate } from "@/utils/format";
import { Order } from "@/types";

interface CustomerOrdersProps {
  orders?: Order[];
  onNavigate: (section: string) => void;
}

export default function CustomerOrders({ orders = [], onNavigate }: CustomerOrdersProps) {
  const [activeFilter, setActiveFilter] = useState("all");

  // Mock orders for demonstration
  const mockOrders: Order[] = orders.length > 0 ? orders : [
    {
      id: "ORD-2024-001",
      customer_id: "user1",
      product_id: "prod1",
      status: "in_production",
      quantity: 1,
      customer_price: 45.00,
      created_at: "2024-01-15T14:30:00Z",
      updated_at: "2024-01-15T14:30:00Z",
      accepted_at: "2024-01-15T15:00:00Z",
      paid_at: "2024-01-15T15:30:00Z",
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
      accepted_at: "2024-01-12T10:00:00Z",
      paid_at: "2024-01-12T10:30:00Z",
      completed_at: "2024-01-13T16:00:00Z",
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

  const filterOrders = (orders: Order[], filter: string) => {
    switch (filter) {
      case "active":
        return orders.filter(order => 
          ["pending", "accepted", "paid", "in_production", "completed_by_producer"].includes(order.status)
        );
      case "completed":
        return orders.filter(order => order.status === "confirmed");
      case "cancelled":
        return orders.filter(order => ["cancelled", "rejected"].includes(order.status));
      default:
        return orders;
    }
  };

  const filteredOrders = filterOrders(mockOrders, activeFilter);

  const handleReorder = (order: Order) => {
    // TODO: Implement reorder functionality
    console.log("Reordering:", order.id);
  };

  const handleRateProducer = (order: Order) => {
    // TODO: Implement rating functionality
    console.log("Rating producer for order:", order.id);
  };

  const handleMessageProducer = (order: Order) => {
    onNavigate("messages");
    // TODO: Open specific conversation
  };

  if (mockOrders.length === 0) {
    return (
      <div className="space-y-8" data-testid="customer-orders-empty">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-card-foreground mb-2">Siparişlerim</h2>
          <p className="text-muted-foreground">Tüm siparişlerinizi takip edin ve yönetin.</p>
        </div>

        <div className="text-center py-12">
          <Box className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-card-foreground mb-2">Henüz sipariş bulunmuyor</h3>
          <p className="text-muted-foreground mb-6">İlk 3D baskı siparişinizi oluşturun</p>
          <Button onClick={() => onNavigate("upload")} data-testid="button-create-order">
            Sipariş Oluştur
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="customer-orders">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-card-foreground mb-2">Siparişlerim</h2>
        <p className="text-muted-foreground">Tüm siparişlerinizi takip edin ve yönetin.</p>
      </div>

      {/* Order Filters */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeFilter} onValueChange={setActiveFilter}>
            <TabsList className="w-full justify-start rounded-none border-b">
              <TabsTrigger value="all" data-testid="filter-all">
                Tümü ({mockOrders.length})
              </TabsTrigger>
              <TabsTrigger value="active" data-testid="filter-active">
                Aktif ({filterOrders(mockOrders, "active").length})
              </TabsTrigger>
              <TabsTrigger value="completed" data-testid="filter-completed">
                Tamamlanan ({filterOrders(mockOrders, "completed").length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" data-testid="filter-cancelled">
                İptal Edilen ({filterOrders(mockOrders, "cancelled").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeFilter} className="mt-0">
              <div className="p-6">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Bu kategoride sipariş bulunmuyor</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <Card key={order.id} data-testid={`order-card-${order.id}`}>
                        <CardContent className="p-6">
                          {/* Order Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Box className="w-8 h-8 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-card-foreground" data-testid={`order-name-${order.id}`}>
                                  {order.product?.name}
                                </h3>
                                <p className="text-sm text-muted-foreground" data-testid={`order-id-${order.id}`}>
                                  Sipariş #{order.id}
                                </p>
                                <p className="text-sm text-muted-foreground" data-testid={`order-date-${order.id}`}>
                                  {formatDate(order.created_at, true)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <OrderStatusBadge status={order.status} data-testid={`order-status-${order.id}`} />
                              <p className="text-lg font-semibold text-card-foreground mt-2" data-testid={`order-price-${order.id}`}>
                                {formatTRY(order.customer_price || 0)}
                              </p>
                            </div>
                          </div>

                          {/* Order Timeline */}
                          <OrderTimeline 
                            orderStatus={order.status}
                            timestamps={{
                              pending: order.accepted_at,
                              paid: order.paid_at,
                              completed: order.completed_at,
                            }}
                          />

                          {/* Producer Info & Actions */}
                          <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                            <div className="flex items-center space-x-4">
                              {order.producer && (
                                <>
                                  <div className="flex items-center space-x-2">
                                    <Avatar className="w-6 h-6">
                                      <AvatarFallback className="text-xs">
                                        {order.producer.name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm text-muted-foreground">
                                      Üretici: <span className="text-card-foreground font-medium">{order.producer.name}</span>
                                    </span>
                                  </div>
                                  {order.status === "confirmed" && (
                                    <div className="flex items-center space-x-1">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                                      ))}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>

                            <div className="flex space-x-2">
                              {order.producer && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMessageProducer(order)}
                                  data-testid={`button-message-${order.id}`}
                                >
                                  <MessageCircle className="w-4 h-4 mr-2" />
                                  Mesaj Gönder
                                </Button>
                              )}
                              
                              {order.status === "confirmed" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReorder(order)}
                                    data-testid={`button-reorder-${order.id}`}
                                  >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Tekrar Sipariş Ver
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleRateProducer(order)}
                                    data-testid={`button-rate-${order.id}`}
                                  >
                                    <Star className="w-4 h-4 mr-2" />
                                    Değerlendir
                                  </Button>
                                </>
                              )}

                              <Button
                                variant="outline"
                                size="sm"
                                data-testid={`button-details-${order.id}`}
                              >
                                Detaylar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
