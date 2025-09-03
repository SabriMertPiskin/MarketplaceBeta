import { Users, Factory, RussianRuble, Percent, UserPlus, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTRY, formatDate } from "@/utils/format";
import { DashboardStats } from "@/types";

interface AdminDashboardProps {
  stats?: DashboardStats;
  recentActivity?: Array<{
    id: string;
    type: "user_registration" | "order_completed" | "producer_joined";
    title: string;
    description: string;
    timestamp: string;
  }>;
}

export default function AdminDashboard({ 
  stats = {}, 
  recentActivity = [] 
}: AdminDashboardProps) {
  const mockStats = {
    total_users: 1247,
    active_producers: 89,
    total_revenue: 54320,
    commission_earned: 8148,
    ...stats,
  };

  const mockActivity = recentActivity.length > 0 ? recentActivity : [
    {
      id: "1",
      type: "user_registration" as const,
      title: "Yeni kullanıcı kaydı",
      description: "can.demir@email.com - 5 dakika önce",
      timestamp: "2024-01-16T15:55:00Z",
    },
    {
      id: "2", 
      type: "order_completed" as const,
      title: "Sipariş tamamlandı",
      description: "#ORD-2024-156 - ₺75,00 - 15 dakika önce",
      timestamp: "2024-01-16T15:45:00Z",
    },
    {
      id: "3",
      type: "producer_joined" as const,
      title: "Yeni üretici katıldı",
      description: "Ankara 3D Baskı - 1 saat önce",
      timestamp: "2024-01-16T15:00:00Z",
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user_registration":
        return <UserPlus className="w-4 h-4 text-primary" />;
      case "order_completed":
        return <CheckCircle className="w-4 h-4 text-secondary" />;
      case "producer_joined":
        return <Factory className="w-4 h-4 text-accent-foreground" />;
      default:
        return <UserPlus className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="space-y-8" data-testid="admin-dashboard">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-card-foreground mb-2">Yönetim Paneli</h2>
        <p className="text-muted-foreground">Pazaryeri istatistiklerini ve kullanıcıları yönetin.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Toplam Kullanıcı</p>
                <p className="text-2xl font-bold text-card-foreground" data-testid="stat-total-users">
                  {mockStats.total_users?.toLocaleString('tr-TR')}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aktif Üretici</p>
                <p className="text-2xl font-bold text-card-foreground" data-testid="stat-active-producers">
                  {mockStats.active_producers}
                </p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Factory className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bu Ay Ciro</p>
                <p className="text-2xl font-bold text-card-foreground" data-testid="stat-total-revenue">
                  {formatTRY(mockStats.total_revenue || 0)}
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
                <p className="text-sm font-medium text-muted-foreground">Komisyon</p>
                <p className="text-2xl font-bold text-card-foreground" data-testid="stat-commission">
                  {formatTRY(mockStats.commission_earned || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                <Percent className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-card-foreground">Son Aktiviteler</CardTitle>
        </CardHeader>
        <CardContent>
          {mockActivity.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Henüz aktivite bulunmuyor</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mockActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  data-testid={`activity-${activity.id}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground" data-testid={`activity-title-${activity.id}`}>
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground" data-testid={`activity-description-${activity.id}`}>
                        {activity.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground" data-testid={`activity-time-${activity.id}`}>
                    {formatDate(activity.timestamp, true)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="quick-action-users">
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-card-foreground mb-1">Kullanıcı Yönetimi</h3>
            <p className="text-sm text-muted-foreground">Kullanıcıları görüntüle ve yönet</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="quick-action-orders">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-8 h-8 text-secondary mx-auto mb-2" />
            <h3 className="font-semibold text-card-foreground mb-1">Sipariş Yönetimi</h3>
            <p className="text-sm text-muted-foreground">Tüm siparişleri incele</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" data-testid="quick-action-analytics">
          <CardContent className="p-6 text-center">
            <Percent className="w-8 h-8 text-destructive mx-auto mb-2" />
            <h3 className="font-semibold text-card-foreground mb-1">Analitik Raporlar</h3>
            <p className="text-sm text-muted-foreground">Detaylı raporları görüntüle</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
