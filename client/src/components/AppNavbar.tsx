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
    <nav className="bg-white shadow-sm fixed w-full z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <div className="bg-primary text-white h-10 w-10 rounded-full flex items-center justify-center">
                  <Bell className="h-5 w-5" />
                </div>
                <span className="ml-2 text-xl font-semibold text-gray-800">NotifyFlow</span>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link href="/">
              <Button 
                variant={location === "/" ? "default" : "ghost"}
                className="flex items-center gap-2"
                size="sm"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            </Link>
            
            <Link href="/history">
              <Button 
                variant={location === "/history" ? "default" : "ghost"}
                className="flex items-center gap-2"
                size="sm"
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </Button>
            </Link>
            
            <Link href="/notifications">
              <Button 
                variant={location === "/notifications" ? "default" : "ghost"}
                className="flex items-center gap-2 relative"
                size="sm"
              >
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notifications</span>
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </Link>
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {getInitials(user.displayName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
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
