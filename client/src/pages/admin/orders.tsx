import { useState } from "react";
import { Search, Filter, Download, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderStatusBadge } from "@/components/orders/order-timeline";
import { formatTRY, formatDate } from "@/utils/format";
import { Order } from "@/types";

export default function AdminOrders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");

  // Mock orders data
  const mockOrders: Order[] = [
    {
      id: "ORD-2024-001",
      customer_id: "customer1",
      producer_id: "producer1",
      product_id: "prod1",
      status: "in_production",
      quantity: 1,
      customer_price: 45.00,
      producer_earnings: 38.25,
      platform_commission: 6.75,
      payment_fee: 1.13,
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
      producer: {
        id: "producer1",
        email: "mehmet@example.com",
        name: "Mehmet Özkan",
        role: "producer" as const,
        kvkv_consent: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        is_active: true,
      },
    },
    {
      id: "ORD-2024-002",
      customer_id: "customer2",
      producer_id: "producer2",
      product_id: "prod2",
      status: "confirmed",
      quantity: 1,
      customer_price: 25.50,
      producer_earnings: 21.67,
      platform_commission: 3.83,
      payment_fee: 0.64,
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
    {
      id: "ORD-2024-003",
      customer_id: "customer3",
      product_id: "prod3",
      status: "pending",
      quantity: 1,
      customer_price: 65.00,
      created_at: "2024-01-16T10:20:00Z",
      updated_at: "2024-01-16T10:20:00Z",
      product: {
        id: "prod3",
        user_id: "customer3",
        name: "Telefon Stand",
        status: "approved",
        created_at: "2024-01-16T10:20:00Z",
        updated_at: "2024-01-16T10:20:00Z",
      },
      customer: {
        id: "customer3",
        email: "can@example.com",
        name: "Can Demir",
        role: "customer" as const,
        kvkk_consent: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        is_active: true,
      },
    },
  ];

  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.producer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case "created_at":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "customer_price":
        return (b.customer_price || 0) - (a.customer_price || 0);
      case "status":
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  const handleExportOrders = () => {
    // TODO: Implement order export functionality
    console.log("Exporting orders...");
  };

  const handleViewOrder = (orderId: string) => {
    // TODO: Implement order detail view
    console.log("Viewing order:", orderId);
  };

  const orderStats = {
    total: mockOrders.length,
    pending: mockOrders.filter(o => o.status === "pending").length,
    active: mockOrders.filter(o => 
      ["accepted", "paid", "in_production"].includes(o.status)
    ).length,
    completed: mockOrders.filter(o => o.status === "confirmed").length,
    totalRevenue: mockOrders.reduce((sum, order) => sum + (order.customer_price || 0), 0),
    totalCommission: mockOrders.reduce((sum, order) => sum + (order.platform_commission || 0), 0),
  };

  return (
    <div className="space-y-8" data-testid="admin-orders">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-card-foreground mb-2">Sipariş Yönetimi</h2>
        <p className="text-muted-foreground">Tüm siparişleri görüntüleyin ve yönetin.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-card-foreground" data-testid="stat-total-orders">
              {orderStats.total}
            </p>
            <p className="text-sm text-muted-foreground">Toplam</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600" data-testid="stat-pending-orders">
              {orderStats.pending}
            </p>
            <p className="text-sm text-muted-foreground">Bekleyen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600" data-testid="stat-active-orders">
              {orderStats.active}
            </p>
            <p className="text-sm text-muted-foreground">Aktif</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600" data-testid="stat-completed-orders">
              {orderStats.completed}
            </p>
            <p className="text-sm text-muted-foreground">Tamamlanan</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-lg font-bold text-card-foreground" data-testid="stat-total-revenue">
              {formatTRY(orderStats.totalRevenue)}
            </p>
            <p className="text-sm text-muted-foreground">Toplam Ciro</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-lg font-bold text-primary" data-testid="stat-total-commission">
              {formatTRY(orderStats.totalCommission)}
            </p>
            <p className="text-sm text-muted-foreground">Komisyon</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Siparişler</CardTitle>
            <Button onClick={handleExportOrders} data-testid="button-export-orders">
              <Download className="w-4 h-4 mr-2" />
              Dışa Aktar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Sipariş ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-orders"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Durum filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="pending">Bekleyen</SelectItem>
                <SelectItem value="accepted">Kabul Edildi</SelectItem>
                <SelectItem value="paid">Ödendi</SelectItem>
                <SelectItem value="in_production">Üretimde</SelectItem>
                <SelectItem value="confirmed">Tamamlandı</SelectItem>
                <SelectItem value="cancelled">İptal Edildi</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]" data-testid="select-sort">
                <SelectValue placeholder="Sırala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Tarihe Göre</SelectItem>
                <SelectItem value="customer_price">Fiyata Göre</SelectItem>
                <SelectItem value="status">Duruma Göre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orders Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sipariş</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Üretici</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Komisyon</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-muted-foreground">Sipariş bulunamadı</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedOrders.map((order) => (
                    <TableRow key={order.id} data-testid={`order-row-${order.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-card-foreground" data-testid={`order-id-${order.id}`}>
                            {order.id}
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid={`order-product-${order.id}`}>
                            {order.product?.name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {order.customer?.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm" data-testid={`order-customer-${order.id}`}>
                            {order.customer?.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.producer ? (
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {order.producer.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm" data-testid={`order-producer-${order.id}`}>
                              {order.producer.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell data-testid={`order-date-${order.id}`}>
                        {formatDate(order.created_at)}
                      </TableCell>
                      <TableCell data-testid={`order-price-${order.id}`}>
                        {formatTRY(order.customer_price || 0)}
                      </TableCell>
                      <TableCell data-testid={`order-commission-${order.id}`}>
                        {formatTRY(order.platform_commission || 0)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewOrder(order.id)}
                          data-testid={`button-view-order-${order.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
