import { useState } from "react";
import { LogOut, Bell, User, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface HeaderProps {
  title: string;
  icon: React.ReactNode;
  navigation: Array<{
    label: string;
    section: string;
    active?: boolean;
  }>;
  onNavigate: (section: string) => void;
  color?: "primary" | "secondary" | "destructive";
}

export function Header({ title, icon, navigation, onNavigate, color = "primary" }: HeaderProps) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const colorClasses = {
    primary: "text-primary bg-primary",
    secondary: "text-secondary bg-secondary",
    destructive: "text-destructive bg-destructive",
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      {/* Main Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
                {icon}
              </div>
              <h1 className="text-xl font-semibold text-card-foreground">{title}</h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <button
                  key={item.section}
                  onClick={() => onNavigate(item.section)}
                  className={`nav-btn transition-colors ${
                    item.active
                      ? `${colorClasses[color].split(" ")[0]} font-medium`
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`nav-${item.section}`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              {/* Mobile Menu Trigger */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col space-y-4 mt-8">
                    {navigation.map((item) => (
                      <button
                        key={item.section}
                        onClick={() => {
                          onNavigate(item.section);
                          setMobileMenuOpen(false);
                        }}
                        className={`text-left p-3 rounded-md transition-colors ${
                          item.active
                            ? `${colorClasses[color]} text-${color}-foreground`
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                        data-testid={`mobile-nav-${item.section}`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-xs"></span>
              </Button>

              {/* User Profile */}
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium text-card-foreground" data-testid="text-username">
                  {user?.name}
                </span>
              </div>

              {/* Logout */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden bg-card border-b border-border">
        <div className="px-4 py-2 flex space-x-2 overflow-x-auto">
          {navigation.map((item) => (
            <button
              key={item.section}
              onClick={() => onNavigate(item.section)}
              className={`whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                item.active
                  ? `${colorClasses[color]} text-${color}-foreground`
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
              data-testid={`mobile-tab-${item.section}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
