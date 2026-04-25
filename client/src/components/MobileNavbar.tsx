import { Link, useLocation } from "wouter";
import { Bell, History, Home, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

export function MobileNavbar() {
  const [location] = useLocation();
  
  // Query for unread notifications count
  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
  });
  
  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-50 md:hidden">
      <nav className="flex justify-around items-center h-16">
        <Link href="/">
          <button className={`flex flex-col items-center justify-center w-1/4 py-1 ${location === "/" ? "text-primary" : "text-gray-500"}`}>
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Inicio</span>
          </button>
        </Link>
        
        <Link href="/history">
          <button className={`flex flex-col items-center justify-center w-1/4 py-1 ${location === "/history" ? "text-primary" : "text-gray-500"}`}>
            <History className="h-5 w-5" />
            <span className="text-xs mt-1">Historial</span>
          </button>
        </Link>
        
        <Link href="/notifications">
          <button className={`flex flex-col items-center justify-center w-1/4 py-1 ${location === "/notifications" ? "text-primary" : "text-gray-500"} relative`}>
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
            <span className="text-xs mt-1">Notificaciones</span>
          </button>
        </Link>
        
        <Link href="/profile">
          <button className={`flex flex-col items-center justify-center w-1/4 py-1 ${location === "/profile" ? "text-primary" : "text-gray-500"}`}>
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Perfil</span>
          </button>
        </Link>
      </nav>
    </div>
  );
}
