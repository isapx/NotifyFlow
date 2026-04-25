import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMobile } from "@/hooks/use-mobile";
import { AppNavbar } from "@/components/AppNavbar";
import { MobileNavbar } from "@/components/MobileNavbar";
import { useQuery } from "@tanstack/react-query";
import { 
  Bell,
  Building,
  CircleUser,
  ClipboardList,
  HelpCircle,
  LogOut,
  Mail,
  QrCode,
  Settings,
  Smartphone,
  Store,
  User,
  UserCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { QRCodeModal } from "@/components/modals/QRCodeModal";

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const isMobile = useMobile();
  const [showQRModal, setShowQRModal] = useState(false);
  
  // Fetch connections
  const { 
    data: connections, 
    isLoading: isLoadingConnections 
  } = useQuery({
    queryKey: ["/api/connections/active"],
  });
  
  // Fetch notifications
  const { 
    data: notifications, 
    isLoading: isLoadingNotifications 
  } = useQuery({
    queryKey: ["/api/notifications"],
  });
  
  // Get active connections count
  const activeConnectionsCount = connections?.filter((c: any) => c.status === "active").length || 0;
  
  // Get notifications count
  const notificationsCount = notifications?.length || 0;
  
  // Get unread notifications count
  const unreadNotificationsCount = notifications?.filter((n: any) => !n.isRead).length || 0;
  
  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavbar />
      
      <div className="pt-16 pb-16 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Info */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-center mb-2">
                    <Avatar className="h-24 w-24">
                      <AvatarFallback className="text-2xl bg-primary text-white">
                        {user ? getInitials(user.displayName) : "?"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <CardTitle className="text-center">{user?.displayName}</CardTitle>
                  <CardDescription className="text-center">
                    <Badge className="mt-1">
                      {user?.userType === "business" ? "Negocio" : "Cliente"}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <UserCircle className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm">{user?.username}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm">{user?.email}</span>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Store className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm">Conexiones activas</span>
                      </div>
                      <Badge variant="outline">{activeConnectionsCount}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Bell className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm">Notificaciones</span>
                      </div>
                      <Badge variant="outline">{notificationsCount}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <QrCode className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm">
                          {user?.userType === "customer" ? "Códigos QR generados" : "Códigos QR escaneados"}
                        </span>
                      </div>
                      <Badge variant="outline">0</Badge>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  {user?.userType === "customer" && (
                    <Button 
                      className="w-full"
                      onClick={() => setShowQRModal(true)}
                    >
                      <QrCode className="mr-2 h-4 w-4" />
                      Generar código QR
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
            
            {/* Settings & Actions */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración de la cuenta</CardTitle>
                  <CardDescription>
                    Administra la configuración y preferencias de tu cuenta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Configuración general</h3>
                    
                    <div className="flex justify-between items-center py-2 border-b">
                      <div className="flex items-center">
                        <CircleUser className="h-5 w-5 text-gray-500 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium">Información del perfil</h4>
                          <p className="text-xs text-gray-500">Actualiza los datos de tu perfil</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Editar</Button>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b">
                      <div className="flex items-center">
                        <Settings className="h-5 w-5 text-gray-500 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium">Configuración de la cuenta</h4>
                          <p className="text-xs text-gray-500">Administra las preferencias de tu cuenta</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Administrar</Button>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b">
                      <div className="flex items-center">
                        <Bell className="h-5 w-5 text-gray-500 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium">Preferencias de notificación</h4>
                          <p className="text-xs text-gray-500">Controla cómo recibes las notificaciones</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Configurar</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium">Ayuda y soporte</h3>
                    
                    <div className="flex justify-between items-center py-2 border-b">
                      <div className="flex items-center">
                        <HelpCircle className="h-5 w-5 text-gray-500 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium">Centro de ayuda</h4>
                          <p className="text-xs text-gray-500">Obtén ayuda para usar NotificApp</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Visitar</Button>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b">
                      <div className="flex items-center">
                        <Smartphone className="h-5 w-5 text-gray-500 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium">Descargar app móvil</h4>
                          <p className="text-xs text-gray-500">Obtén NotificApp en tu dispositivo móvil</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Descargar</Button>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar sesión
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Acerca de NotificApp</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    NotificApp es una plataforma que permite la comunicación privada entre empresas y clientes mediante códigos QR. No es necesario compartir números de teléfono ni correos electrónicos.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium">Enfoque en la privacidad</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Conéctate sin compartir tus datos de contacto personales
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium">Actualizaciones en tiempo real</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Recibe notificaciones instantáneas cuando los servicios estén listos
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="text-xs text-gray-500">
                  Versión 1.0.0 • Términos y privacidad
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <MobileNavbar />
      
      {/* QR Code Modal */}
      <QRCodeModal 
        isOpen={showQRModal} 
        onClose={() => setShowQRModal(false)} 
      />
    </div>
  );
}
