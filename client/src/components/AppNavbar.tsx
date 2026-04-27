import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Bell, History, Home, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

export function AppNavbar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  // Query for unread notifications count
  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
  });
  
  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <nav className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 shadow-lg fixed w-full z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <div className="bg-white text-purple-600 h-10 w-10 rounded-full flex items-center justify-center shadow-lg font-bold">
                  <Bell className="h-5 w-5" />
                </div>
                <span className="ml-2 text-xl font-bold text-white drop-shadow-lg">NotificApp</span>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link href="/">
              <Button 
                variant={location === "/" ? "default" : "ghost"}
                className={`flex items-center gap-2 ${location === "/" ? "bg-white text-purple-600 hover:bg-gray-100" : "text-white hover:bg-white hover:bg-opacity-20"}`}
                size="sm"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Inicio</span>
              </Button>
            </Link>
            
            <Link href="/history">
              <Button 
                variant={location === "/history" ? "default" : "ghost"}
                className={`flex items-center gap-2 ${location === "/history" ? "bg-white text-purple-600 hover:bg-gray-100" : "text-white hover:bg-white hover:bg-opacity-20"}`}
                size="sm"
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Historial</span>
              </Button>
            </Link>
            
            <Link href="/notifications">
              <Button 
                variant={location === "/notifications" ? "default" : "ghost"}
                className={`flex items-center gap-2 relative ${location === "/notifications" ? "bg-white text-purple-600 hover:bg-gray-100" : "text-white hover:bg-white hover:bg-opacity-20"}`}
                size="sm"
              >
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notificaciones</span>
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </Link>
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full bg-white hover:bg-gray-100">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold">
                        {getInitials(user.displayName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
