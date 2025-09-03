import { useState } from "react";
import { Search, UserPlus, MoreHorizontal, Shield, Factory, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/utils/format";
import { User as UserType } from "@/types";

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");

  // Mock users data
  const mockUsers: UserType[] = [
    {
      id: "1",
      email: "admin@example.com",
      name: "Admin User",
      role: "admin",
      kvkk_consent: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-16T10:00:00Z",
      last_login: "2024-01-16T15:30:00Z",
      is_active: true,
    },
    {
      id: "2",
      email: "mehmet@example.com",
      name: "Mehmet Özkan",
      role: "producer",
      phone: "+90 555 123 4567",
      kvkk_consent: true,
      created_at: "2024-01-05T00:00:00Z",
      updated_at: "2024-01-16T09:00:00Z",
      last_login: "2024-01-16T14:20:00Z",
      is_active: true,
    },
    {
      id: "3",
      email: "ayse@example.com",
      name: "Ayşe Demir",
      role: "producer",
      phone: "+90 555 987 6543",
      kvkk_consent: true,
      created_at: "2024-01-08T00:00:00Z",
      updated_at: "2024-01-16T08:30:00Z",
      last_login: "2024-01-16T13:45:00Z",
      is_active: true,
    },
    {
      id: "4",
      email: "ahmet@example.com",
      name: "Ahmet Yılmaz",
      role: "customer",
      kvkk_consent: true,
      created_at: "2024-01-10T00:00:00Z",
      updated_at: "2024-01-16T11:15:00Z",
      last_login: "2024-01-16T16:00:00Z",
      is_active: true,
    },
    {
      id: "5",
      email: "zeynep@example.com",
      name: "Zeynep Kaya",
      role: "customer",
      kvkk_consent: true,
      created_at: "2024-01-12T00:00:00Z",
      updated_at: "2024-01-16T07:20:00Z",
      last_login: "2024-01-15T19:30:00Z",
      is_active: false,
    },
  ];

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="w-4 h-4 text-destructive" />;
      case "producer":
        return <Factory className="w-4 h-4 text-secondary" />;
      default:
        return <User className="w-4 h-4 text-primary" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: "destructive",
      producer: "secondary", 
      customer: "default",
    } as const;

    const labels = {
      admin: "Admin",
      producer: "Üretici",
      customer: "Müşteri",
    };

    return (
      <Badge variant={variants[role as keyof typeof variants] || "default"}>
        {labels[role as keyof typeof labels] || role}
      </Badge>
    );
  };

  const handleUserAction = (action: string, userId: string) => {
    // TODO: Implement user actions (activate, deactivate, delete, etc.)
    console.log(`Action: ${action}, User: ${userId}`);
  };

  const userStats = {
    total: mockUsers.length,
    admin: mockUsers.filter(u => u.role === "admin").length,
    producer: mockUsers.filter(u => u.role === "producer").length,
    customer: mockUsers.filter(u => u.role === "customer").length,
    active: mockUsers.filter(u => u.is_active).length,
  };

  return (
    <div className="space-y-8" data-testid="admin-users">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-card-foreground mb-2">Kullanıcı Yönetimi</h2>
        <p className="text-muted-foreground">Tüm kullanıcıları görüntüleyin ve yönetin.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-card-foreground" data-testid="stat-total-users">
              {userStats.total}
            </p>
            <p className="text-sm text-muted-foreground">Toplam</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive" data-testid="stat-admin-users">
              {userStats.admin}
            </p>
            <p className="text-sm text-muted-foreground">Admin</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-secondary" data-testid="stat-producer-users">
              {userStats.producer}
            </p>
            <p className="text-sm text-muted-foreground">Üretici</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary" data-testid="stat-customer-users">
              {userStats.customer}
            </p>
            <p className="text-sm text-muted-foreground">Müşteri</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-card-foreground" data-testid="stat-active-users">
              {userStats.active}
            </p>
            <p className="text-sm text-muted-foreground">Aktif</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Kullanıcılar</CardTitle>
            <Button data-testid="button-add-user">
              <UserPlus className="w-4 h-4 mr-2" />
              Yeni Kullanıcı
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Kullanıcı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-users"
              />
            </div>
            <div className="flex gap-2">
              {["all", "admin", "producer", "customer"].map((role) => (
                <Button
                  key={role}
                  variant={selectedRole === role ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRole(role)}
                  data-testid={`filter-${role}`}
                >
                  {role === "all" ? "Tümü" : 
                   role === "admin" ? "Admin" :
                   role === "producer" ? "Üretici" : "Müşteri"}
                </Button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Kayıt Tarihi</TableHead>
                  <TableHead>Son Giriş</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">Kullanıcı bulunamadı</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-card-foreground" data-testid={`user-name-${user.id}`}>
                              {user.name}
                            </p>
                            <p className="text-sm text-muted-foreground" data-testid={`user-email-${user.id}`}>
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getRoleIcon(user.role)}
                          {getRoleBadge(user.role)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.is_active ? "default" : "secondary"}
                          data-testid={`user-status-${user.id}`}
                        >
                          {user.is_active ? "Aktif" : "Pasif"}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`user-created-${user.id}`}>
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell data-testid={`user-last-login-${user.id}`}>
                        {user.last_login ? formatDate(user.last_login, true) : "Hiç"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`user-actions-${user.id}`}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleUserAction("view", user.id)}>
                              Detayları Görüntüle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUserAction("edit", user.id)}>
                              Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleUserAction(user.is_active ? "deactivate" : "activate", user.id)}
                            >
                              {user.is_active ? "Pasifleştir" : "Aktifleştir"}
                            </DropdownMenuItem>
                            {user.role !== "admin" && (
                              <DropdownMenuItem 
                                onClick={() => handleUserAction("delete", user.id)}
                                className="text-destructive"
                              >
                                Sil
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
