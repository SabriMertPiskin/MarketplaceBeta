import { useState } from "react";
import { TrendingUp, TrendingDown, Calendar, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { formatTRY } from "@/utils/format";

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState("30d");

  // Mock analytics data
  const analyticsData = {
    revenue: {
      current: 54320,
      previous: 48750,
      change: 11.4,
    },
    orders: {
      current: 127,
      previous: 115,
      change: 10.4,
    },
    users: {
      current: 89,
      previous: 76,
      change: 17.1,
    },
    conversion: {
      current: 24.5,
      previous: 22.1,
      change: 10.9,
    },
    topProducers: [
      { name: "Mehmet Özkan", orders: 23, revenue: 1245.50 },
      { name: "Ayşe Demir", orders: 19, revenue: 987.25 },
      { name: "Can Yılmaz", orders: 15, revenue: 834.75 },
      { name: "Zeynep Kaya", orders: 12, revenue: 675.00 },
    ],
    popularProducts: [
      { name: "Telefon Kılıfı", orders: 45, percentage: 35.4 },
      { name: "Anahtarlık", orders: 32, percentage: 25.2 },
      { name: "Telefon Stand", orders: 28, percentage: 22.0 },
      { name: "Bardak Tutacağı", orders: 22, percentage: 17.3 },
    ],
    revenueByMonth: [
      { month: "Ocak", revenue: 42500 },
      { month: "Şubat", revenue: 38750 },
      { month: "Mart", revenue: 51200 },
      { month: "Nisan", revenue: 48900 },
      { month: "Mayıs", revenue: 54320 },
    ],
  };

  const handleExportReport = () => {
    // TODO: Implement report export
    console.log("Exporting analytics report...");
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? "text-green-600" : "text-red-600";
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  return (
    <div className="space-y-8" data-testid="admin-analytics">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-card-foreground mb-2">Analitik Raporlar</h2>
          <p className="text-muted-foreground">Pazaryeri performansını detaylı olarak analiz edin.</p>
        </div>
        <div className="flex gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]" data-testid="select-date-range">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Son 7 Gün</SelectItem>
              <SelectItem value="30d">Son 30 Gün</SelectItem>
              <SelectItem value="90d">Son 3 Ay</SelectItem>
              <SelectItem value="1y">Son 1 Yıl</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportReport} data-testid="button-export-report">
            <Download className="w-4 h-4 mr-2" />
            Rapor İndir
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Toplam Gelir</p>
                <p className="text-2xl font-bold text-card-foreground" data-testid="metric-revenue">
                  {formatTRY(analyticsData.revenue.current)}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {getChangeIcon(analyticsData.revenue.change)}
                  <span className={`text-sm font-medium ${getChangeColor(analyticsData.revenue.change)}`}>
                    %{Math.abs(analyticsData.revenue.change)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Toplam Sipariş</p>
                <p className="text-2xl font-bold text-card-foreground" data-testid="metric-orders">
                  {analyticsData.orders.current}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {getChangeIcon(analyticsData.orders.change)}
                  <span className={`text-sm font-medium ${getChangeColor(analyticsData.orders.change)}`}>
                    %{Math.abs(analyticsData.orders.change)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Yeni Kullanıcı</p>
                <p className="text-2xl font-bold text-card-foreground" data-testid="metric-users">
                  {analyticsData.users.current}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {getChangeIcon(analyticsData.users.change)}
                  <span className={`text-sm font-medium ${getChangeColor(analyticsData.users.change)}`}>
                    %{Math.abs(analyticsData.users.change)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dönüşüm Oranı</p>
                <p className="text-2xl font-bold text-card-foreground" data-testid="metric-conversion">
                  %{analyticsData.conversion.current}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {getChangeIcon(analyticsData.conversion.change)}
                  <span className={`text-sm font-medium ${getChangeColor(analyticsData.conversion.change)}`}>
                    %{Math.abs(analyticsData.conversion.change)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Producers */}
        <Card>
          <CardHeader>
            <CardTitle>En Çok Sipariş Alan Üreticiler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.topProducers.map((producer, index) => (
                <div
                  key={producer.name}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  data-testid={`top-producer-${index}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-secondary">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground">{producer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {producer.orders} sipariş
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-card-foreground">
                      {formatTRY(producer.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Popular Products */}
        <Card>
          <CardHeader>
            <CardTitle>Popüler Ürünler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.popularProducts.map((product, index) => (
                <div key={product.name} className="space-y-2" data-testid={`popular-product-${index}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-card-foreground">
                      {product.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {product.orders} sipariş
                    </span>
                  </div>
                  <Progress value={product.percentage} className="h-2" />
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">
                      %{product.percentage}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Aylık Gelir Trendi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.revenueByMonth.map((month, index) => (
              <div
                key={month.month}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                data-testid={`revenue-month-${index}`}
              >
                <span className="font-medium text-card-foreground">{month.month}</span>
                <div className="flex items-center space-x-4">
                  <div className="w-48 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(month.revenue / Math.max(...analyticsData.revenueByMonth.map(m => m.revenue))) * 100}%`
                      }}
                    />
                  </div>
                  <span className="font-medium text-card-foreground min-w-[80px] text-right">
                    {formatTRY(month.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
