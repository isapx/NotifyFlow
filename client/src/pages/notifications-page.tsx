import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMobile } from "@/hooks/use-mobile";
import { AppNavbar } from "@/components/AppNavbar";
import { MobileNavbar } from "@/components/MobileNavbar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, formatDistanceToNow } from "date-fns";
import { 
  Bell,
  Check,
  CheckCircle2, 
  Clock, 
  Plus,
  Send,
  Store, 
  User,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Notification form schema
const notificationSchema = z.object({
  connectionId: z.string().min(1, "Connection is required"),
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  message: z.string().min(1, "Message is required").max(500, "Message must be less than 500 characters"),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

export default function NotificationsPage() {
  const { user } = useAuth();
  const isMobile = useMobile();
  const { toast } = useToast();
  const [showNewNotificationDialog, setShowNewNotificationDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  
  // Fetch notifications
  const { 
    data: notifications, 
    isLoading: isLoadingNotifications 
  } = useQuery({
    queryKey: ["/api/notifications"],
  });
  
  // Fetch active connections for sending notifications
  const { 
    data: activeConnections,
    isLoading: isLoadingConnections 
  } = useQuery({
    queryKey: ["/api/connections/active"],
  });
  
  // Create notification form
  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      connectionId: "",
      title: "",
      message: "",
    },
  });
  
  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async (data: { connectionId: number; title: string; message: string }) => {
      const res = await apiRequest("POST", "/api/notifications", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Notificación enviada",
        description: "Su notificación ha sido enviada exitosamente.",
      });
      form.reset();
      setShowNewNotificationDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Error al enviar la notificación. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    },
  });
  
  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest("POST", `/api/notifications/${notificationId}/read`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Marcada como leída",
        description: "Notificación marcada como leída.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Error al marcar la notificación como leída.",
        variant: "destructive",
      });
    },
  });
  
  // Close connection mutation
  const closeConnectionMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      const res = await apiRequest("POST", `/api/connections/${connectionId}/close`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Conexión Cerrada",
        description: "La conexión ha sido cerrada exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Error al cerrar la conexión.",
        variant: "destructive",
      });
    },
  });
  
  // Handle send notification
  const onSubmit = (data: NotificationFormValues) => {
    sendNotificationMutation.mutate({
      connectionId: parseInt(data.connectionId),
      title: data.title,
      message: data.message,
    });
  };

  // Filter notifications based on tab
  const filteredNotifications = notifications?.filter((notification: any) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.isRead;
    if (activeTab === "read") return notification.isRead;
    return true;
  }) || [];
  
  // Format time
  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy h:mm a");
  };
  
  // Group notifications by date
  const groupNotificationsByDate = (notifications: any[]) => {
    const groups: Record<string, any[]> = {};
    
    notifications.forEach((notification) => {
      const date = format(new Date(notification.createdAt), "yyyy-MM-dd");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notification);
    });
    
    return Object.entries(groups).map(([date, items]) => ({
      date,
      formattedDate: format(new Date(date), "EEEE, MMMM d, yyyy"),
      notifications: items
    }));
  };
  
  const groupedNotifications = groupNotificationsByDate(filteredNotifications);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavbar />
      
      <div className="pt-16 pb-16 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Notificaciones</h1>
            
            {user?.userType === "business" && (
              <Button 
                onClick={() => setShowNewNotificationDialog(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Enviar notificación
              </Button>
            )}
          </div>
          
          <Tabs 
            defaultValue="all" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="mb-6"
          >
              <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="unread">No leídas</TabsTrigger>
              <TabsTrigger value="read">Leídas</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {isLoadingNotifications ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                        <div className="flex justify-between">
                          <Skeleton className="h-3 w-1/4" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-8">
              {groupedNotifications.map((group) => (
                <div key={group.date}>
                  <div className="sticky top-16 bg-gray-50 z-10 py-2 mb-2">
                    <h2 className="text-sm font-medium text-gray-500">{group.formattedDate}</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {group.notifications.map((notification: any) => (
                      <Card key={notification.id} className={notification.isRead ? "bg-white" : "bg-white ring-1 ring-primary ring-opacity-20"}>
                        <CardContent className="p-4">
                          <div className="flex items-start">
                            <div className={`rounded-full h-10 w-10 flex items-center justify-center mr-3 flex-shrink-0 ${notification.isRead ? 'bg-gray-100' : 'bg-primary bg-opacity-10'}`}>
                              <CheckCircle2 className={`h-5 w-5 ${notification.isRead ? 'text-gray-500' : 'text-primary'}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <h3 className="font-medium">{notification.title}</h3>
                                <span className="text-xs text-gray-400">{formatTime(notification.createdAt)}</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-sm text-gray-500">
                                  {user?.userType === "business" 
                                    ? `To: ${notification.connection.customer?.displayName}`
                                    : `From: ${notification.connection.business?.displayName}`
                                  }
                                </span>
                                <div className="flex space-x-3">
                                  {!notification.isRead && user?.userType === "customer" && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 px-2 text-xs"
                                      onClick={() => markAsReadMutation.mutate(notification.id)}
                                    >
                                      <Check className="h-3 w-3 mr-1" />
                                      Mark as Read
                                    </Button>
                                  )}
                                  
                                  {notification.connection.status === "active" && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                                      onClick={() => closeConnectionMutation.mutate(notification.connection.id)}
                                    >
                                      <X className="h-3 w-3 mr-1" />
                                      Cerrar Conexión
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                  <Bell className="h-6 w-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Sin notificaciones</h3>
                <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                  {user?.userType === 'customer' 
                    ? 'No has recibido notificaciones todavía. Conéctate con negocios para recibir actualizaciones.'
                    : 'No has enviado notificaciones todavía. Conéctate con clientes para enviar actualizaciones.'}
                </p>
                {user?.userType === "business" && (
                  <Button 
                    className="mt-4"
                    onClick={() => setShowNewNotificationDialog(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Enviar Notificación
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      <MobileNavbar />
      
      {/* Send Notification Dialog */}
      <Dialog open={showNewNotificationDialog} onOpenChange={setShowNewNotificationDialog}>
        <DialogContent className="sm:max-w-md">
                    <DialogHeader>
            <DialogTitle>Enviar notificación</DialogTitle>
            <DialogDescription>
              Envía una notificación a uno de tus clientes conectados.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="connectionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                          {isLoadingConnections ? (
                          <SelectItem value="loading" disabled>Cargando conexiones...</SelectItem>
                        ) : activeConnections && activeConnections.length > 0 ? (
                          activeConnections.map((connection: any) => (
                            <SelectItem 
                              key={connection.id} 
                              value={connection.id.toString()}
                            >
                              {connection.customer?.displayName} - {connection.serviceName}
                            </SelectItem>
                          ))
                          ) : (
                          <SelectItem value="none" disabled>No hay conexiones activas</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="p. ej., Tu auto está listo para recoger" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensaje</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="p. ej., El servicio de mantenimiento de tu auto está completo. Puedes recogerlo en nuestra ubicación." 
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowNewNotificationDialog(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={sendNotificationMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {sendNotificationMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Enviar notificación
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
