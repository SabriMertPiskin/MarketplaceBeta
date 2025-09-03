import { useState } from "react";
import { Box, Clock, CheckCircle, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderStatusBadge, OrderTimeline } from "@/components/orders/order-timeline";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatTRY, formatDate } from "@/utils/format";
import { Order } from "@/types";

export default function ProducerOrders() {
  const [activeFilter, setActiveFilter] = useState("active");

  // Mock orders for demonstration
  const mockOrders: Order[] = [
    {
      id: "ORD-2024-001",
      customer_id: "customer1",
      product_id: "prod1",
      status: "in_production",
      quantity: 1,
      customer_price: 45.00,
      producer_earnings: 38.25,
      created_at: "2024-01-15T14:30:00Z",
      updated_at: "2024-01-15T14:30:00Z",
      accepted_at: "2024-01-15T15:00:00Z",
      paid_at: "2024-01-15T15:30:00Z",
      product: {
        id: "prod1",
        user_id: "customer1",
        name: "Telefon Kılıfı",
        status: "approved",
        created_at: "2024-01-15T14:30:00Z",
        updated_at: "2024-01-15T14:30:00Z",
      },
      customer: {
        id: "customer1",
        email: "ahmet@example.com",
        name: "Ahmet Yılmaz",
        role: "customer" as const,
        kvkk_consent: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        is_active: true,
      },
    },
    {
      id: "ORD-2024-002",
      customer_id: "customer2",
      product_id: "prod2",
      status: "confirmed",
      quantity: 1,
      customer_price: 25.50,
      producer_earnings: 21.67,
      created_at: "2024-01-12T09:15:00Z",
      updated_at: "2024-01-12T09:15:00Z",
      accepted_at: "2024-01-12T10:00:00Z",
      paid_at: "2024-01-12T10:30:00Z",
      completed_at: "2024-01-13T16:00:00Z",
      product: {
        id: "prod2",
        user_id: "customer2",
        name: "Anahtarlık",
        status: "approved",
        created_at: "2024-01-12T09:15:00Z",
        updated_at: "2024-01-12T09:15:00Z",
      },
      customer: {
        id: "customer2",
        email: "zeynep@example.com",
        name: "Zeynep Kaya",
        role: "customer" as const,
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
          ["accepted", "paid", "in_production", "completed_by_producer"].includes(order.status)
        );
      case "pending":
        return orders.filter(order => order.status === "pending");
      case "completed":
        return orders.filter(order => order.status === "confirmed");
      default:
        return orders;
    }
  };

  const filteredOrders = filterOrders(mockOrders, activeFilter);

  const handleMarkCompleted = async (orderId: string) => {
    try {
      // TODO: Implement mark as completed API call
      console.log("Marking order as completed:", orderId);
    } catch (error) {
      console.error("Failed to mark order as completed:", error);
    }
  };

  const handleMessageCustomer = (orderId: string) => {
    // TODO: Open chat with customer
    console.log("Opening chat for order:", orderId);
  };

  return (
    <div className="space-y-8" data-testid="producer-orders">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-card-foreground mb-2">Siparişlerim</h2>
        <p className="text-muted-foreground">Tüm siparişlerinizi yönetin ve takip edin.</p>
      </div>

      {/* Order Filters */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeFilter} onValueChange={setActiveFilter}>
            <TabsList className="w-full justify-start rounded-none border-b">
              <TabsTrigger value="active" data-testid="filter-active">
                Aktif ({filterOrders(mockOrders, "active").length})
              </TabsTrigger>
              <TabsTrigger value="pending" data-testid="filter-pending">
                Bekleyen ({filterOrders(mockOrders, "pending").length})
              </TabsTrigger>
              <TabsTrigger value="completed" data-testid="filter-completed">
                Tamamlanan ({filterOrders(mockOrders, "completed").length})
              </TabsTrigger>
              <TabsTrigger value="all" data-testid="filter-all">
                Tümü ({mockOrders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeFilter} className="mt-0">
              <div className="p-6">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Box className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
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
                              <div className="w-16 h-16 bg-secondary/10 rounded-lg flex items-center justify-center">
                                <Box className="w-8 h-8 text-secondary" />
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
                              <OrderStatusBadge status={order.status} />
                              <p className="text-lg font-semibold text-card-foreground mt-2" data-testid={`order-earnings-${order.id}`}>
                                {formatTRY(order.producer_earnings || 0)}
                              </p>
                              <p className="text-sm text-muted-foreground" data-testid={`order-total-${order.id}`}>
                                Toplam: {formatTRY(order.customer_price || 0)}
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

                          {/* Customer Info & Actions */}
                          <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs">
                                    {order.customer?.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-muted-foreground">
                                  Müşteri: <span className="text-card-foreground font-medium">{order.customer?.name}</span>
                                </span>
                              </div>
                            </div>

                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMessageCustomer(order.id)}
                                data-testid={`button-message-${order.id}`}
                              >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Mesaj Gönder
                              </Button>
                              
                              {order.status === "in_production" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleMarkCompleted(order.id)}
                                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                  data-testid={`button-complete-${order.id}`}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Tamamlandı Olarak İşaretle
                                </Button>
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
