import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMobile } from "@/hooks/use-mobile";
import { AppNavbar } from "@/components/AppNavbar";
import { MobileNavbar } from "@/components/MobileNavbar";
import { QRCodeModal } from "@/components/modals/QRCodeModal";
import { QRScannerModal } from "@/components/modals/QRScannerModal";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bell, 
  Calendar,
  CheckCircle2, 
  Clock, 
  QrCode, 
  ScanLine, 
  Store, 
  User, 
  MoreVertical,
  AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom'; // Added import for useNavigate

const BusinessIcons: Record<string, any> = {
  store: <Store className="h-5 w-5" />,
  restaurant: <Store className="h-5 w-5" />,
  laundry: <Store className="h-5 w-5" />,
  florist: <Store className="h-5 w-5" />,
};

export default function HomePage() {
  const { user } = useAuth();
  const isMobile = useMobile();
  const { toast } = useToast();
  const [showQRModal, setShowQRModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const navigate = useNavigate(); // Added useNavigate hook

  // Fetch active connections
  const { 
    data: connections, 
    isLoading: isLoadingConnections 
  } = useQuery({
    queryKey: ["/api/connections/active"],
  });

  // Fetch recent notifications
  const { 
    data: notifications, 
    isLoading: isLoadingNotifications 
  } = useQuery({
    queryKey: ["/api/notifications"],
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
        title: "Connection Closed",
        description: "The connection has been closed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to close connection.",
        variant: "destructive",
      });
    },
  });

  // Handle close connection
  const handleCloseConnection = (connectionId: number) => {
    closeConnectionMutation.mutate(connectionId);
  };

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest("POST", `/api/notifications/${notificationId}/read`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark notification as read.",
        variant: "destructive",
      });
    },
  });

  // Get recent unread notifications
  const recentNotifications = notifications
    ? notifications.slice(0, 5)
    : [];

  // Get active connections
  const activeConnections = connections || [];

  // Format time
  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  // Get opposite entity (business or customer)
  const getConnectionEntity = (connection: any) => {
    if (user?.userType === "business") {
      return connection.customer;
    } else {
      return connection.business;
    }
  };

  // Get notification status icon
  const getNotificationIcon = (notification: any) => {
    // Default to success icon
    return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  };

  // Get notification source
  const getNotificationSource = (notification: any) => {
    if (user?.userType === "business") {
      return `To: ${notification.connection.customer?.displayName}`;
    } else {
      return `From: ${notification.connection.business?.displayName}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavbar />

      <div className="pt-16 pb-16 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Mobile Welcome Card */}
          {isMobile && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold mb-2">Welcome, {user?.displayName || "User"}!</h2>
                <p className="text-gray-600 mb-4">What would you like to do today?</p>

                <div className="grid grid-cols-2 gap-4 mb-2">
                  {user?.userType === "customer" ? (
                    <Button 
                      variant="outline" 
                      className="h-24 flex flex-col items-center justify-center gap-2"
                      onClick={() => setShowQRModal(true)}
                    >
                      <QrCode className="h-6 w-6 text-primary" />
                      <span className="text-sm font-medium">Generate QR</span>
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="h-24 flex flex-col items-center justify-center gap-2"
                      onClick={() => setShowScannerModal(true)}
                    >
                      <ScanLine className="h-6 w-6 text-primary" />
                      <span className="text-sm font-medium">Scan QR</span>
                    </Button>
                  )}

                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col items-center justify-center gap-2"
                  >
                    <Bell className="h-6 w-6 text-primary" />
                    <span className="text-sm font-medium">Notifications</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Desktop View */}
          {!isMobile && (
            <div className="grid grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="col-span-1">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {user?.userType === "customer" ? (
                      <Button 
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => setShowQRModal(true)}
                      >
                        <QrCode className="h-4 w-4" />
                        Generate QR Code
                      </Button>
                    ) : (
                      <Button 
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => setShowScannerModal(true)}
                      >
                        <ScanLine className="h-4 w-4" />
                        Scan QR Code
                      </Button>
                    )}

                    <Button 
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Bell className="h-4 w-4" />
                      Manage Notifications
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Your Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Active Connections</span>
                      <span className="font-medium">{activeConnections.length}</span>
                    </div>
                    <div className="h-px bg-gray-200"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Notifications This Month</span>
                      <span className="font-medium">{notifications?.length || 0}</span>
                    </div>
                    <div className="h-px bg-gray-200"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        {user?.userType === 'customer' ? 'QR Codes Generated' : 'QR Codes Scanned'}
                      </span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="h-px bg-gray-200"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Completed Services</span>
                      <span className="font-medium">0</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Middle & Right Columns */}
              <div className="col-span-2">
                {/* Active Connections */}
                <Card className="mb-6">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle>Active Connections</CardTitle>
                    <Button variant="link" size="sm" className="text-sm">
                      Manage All
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingConnections ? (
                      <div className="grid grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <Card key={i}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="flex-1 space-y-2">
                                  <Skeleton className="h-4 w-3/4" />
                                  <Skeleton className="h-3 w-1/2" />
                                  <Skeleton className="h-3 w-2/3" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : activeConnections.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {activeConnections.map((connection: any) => {
                          const entity = getConnectionEntity(connection);

                          return (
                            <Card key={connection.id}>
                              <CardContent className="p-4">
                                <div className="flex items-start">
                                  <div className="bg-gray-100 rounded-full h-12 w-12 flex items-center justify-center mr-3 flex-shrink-0">
                                    {entity?.userType === "business" ? (
                                      <Store className="h-5 w-5 text-gray-500" />
                                    ) : (
                                      <User className="h-5 w-5 text-gray-500" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                      <h3 className="font-medium">{entity?.displayName}</h3>
                                      <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">Active</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                      {connection.serviceName}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      Connected {formatTime(connection.createdAt)}
                                    </p>
                                    <div className="mt-3 flex justify-between">
                                      <Button 
                                        variant="link" 
                                        size="sm" 
                                        className="h-auto p-0"
                                        onClick={() => navigate(`/connections/${connection.id}`)}
                                      >
                                        View Details
                                      </Button>
                                      <Button 
                                        variant="link" 
                                        size="sm" 
                                        className="h-auto p-0 text-red-500"
                                        onClick={() => handleCloseConnection(connection.id)}
                                      >
                                        Close
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                          <AlertCircle className="h-6 w-6 text-gray-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No Active Connections</h3>
                        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                          {user?.userType === 'customer' 
                            ? 'Generate a QR code and share it with a business to start a connection.'
                            : 'Scan a customer\'s QR code to start a connection.'}
                        </p>
                        <div className="mt-6">
                          {user?.userType === "customer" ? (
                            <Button onClick={() => setShowQRModal(true)}>
                              <QrCode className="mr-2 h-4 w-4" />
                              Generate QR Code
                            </Button>
                          ) : (
                            <Button onClick={() => setShowScannerModal(true)}>
                              <ScanLine className="mr-2 h-4 w-4" />
                              Scan QR Code
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Notifications */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle>Recent Notifications</CardTitle>
                    <Button variant="link" size="sm" className="text-sm">
                      View All
                    </Button>
                  </CardHeader>
                  <CardContent>
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
                    ) : recentNotifications.length > 0 ? (
                      <div className="space-y-4">
                        {recentNotifications.map((notification: any) => (
                          <Card key={notification.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start">
                                <div className="bg-green-100 rounded-full h-10 w-10 flex items-center justify-center mr-3 flex-shrink-0">
                                  {getNotificationIcon(notification)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between">
                                    <h3 className="font-medium">{notification.title}</h3>
                                    <span className="text-xs text-gray-400">{formatTime(notification.createdAt)}</span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                  <div className="flex justify-between items-center mt-2">
                                    <span className="text-sm text-gray-500">
                                      {getNotificationSource(notification)}
                                    </span>
                                    <div className="flex space-x-3">
                                      <Button 
                                        variant="link" 
                                        size="sm" 
                                        className="h-auto p-0"
                                        onClick={() => navigate(`/connections/${notification.connection.id}`)}
                                      >
                                        View Details
                                      </Button>
                                      {user?.userType === "business" ? (
                                        <Button 
                                          variant="link" 
                                          size="sm" 
                                          className="h-auto p-0 text-red-500"
                                          onClick={() => handleCloseConnection(notification.connection.id)}
                                        >
                                          Close Connection
                                        </Button>
                                      ) : (
                                        <>
                                          {!notification.isRead && (
                                            <Button 
                                              variant="link" 
                                              size="sm" 
                                              className="h-auto p-0"
                                              onClick={() => markAsReadMutation.mutate(notification.id)}
                                            >
                                              Mark as Read
                                            </Button>
                                          )}
                                          <Button 
                                            variant="link" 
                                            size="sm" 
                                            className="h-auto p-0 text-red-500"
                                            onClick={() => handleCloseConnection(notification.connection.id)}
                                          >
                                            Close Connection
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                          <Bell className="h-6 w-6 text-gray-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No Notifications</h3>
                        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                          {user?.userType === 'customer' 
                            ? 'You haven\'t received any notifications yet. Connect with businesses to get updates.'
                            : 'You haven\'t sent any notifications yet. Connect with customers to send updates.'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Mobile Active Connections */}
          {isMobile && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold">Active Connections</h2>
                <Button variant="link" size="sm" className="text-sm p-0">
                  View All
                </Button>
              </div>

              {isLoadingConnections ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-3 w-2/3" />
                          </div>
                          <Skeleton className="h-6 w-6 rounded-full" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : activeConnections.length > 0 ? (
                <div className="space-y-3">
                  {activeConnections.map((connection: any) => {
                    const entity = getConnectionEntity(connection);

                    return (
                      <Card key={connection.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start">
                              <div className="bg-gray-100 rounded-full h-12 w-12 flex items-center justify-center mr-3 flex-shrink-0">
                                {entity?.userType === "business" ? (
                                  <Store className="h-5 w-5 text-gray-500" />
                                ) : (
                                  <User className="h-5 w-5 text-gray-500" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-medium">{entity?.displayName}</h3>
                                <p className="text-sm text-gray-500">{connection.serviceName}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Connected {formatTime(connection.createdAt)}
                                </p>
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/connections/${connection.id}`)}>View Details</DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-500"
                                  onClick={() => handleCloseConnection(connection.id)}
                                >
                                  Close Connection
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                      <AlertCircle className="h-6 w-6 text-gray-500" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900">No Active Connections</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {user?.userType === 'customer' 
                        ? 'Generate a QR code to connect with businesses.'
                        : 'Scan a customer\'s QR code to start a connection.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Mobile Recent Notifications */}
          {isMobile && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold">Recent Notifications</h2>
                <Button variant="link" size="sm" className="text-sm p-0">
                  View All
                </Button>
              </div>

              {isLoadingNotifications ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
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
              ) : recentNotifications.length > 0 ? (
                <div className="space-y-3">
                  {recentNotifications.map((notification: any) => (
                    <Card key={notification.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start">
                          <div className="bg-green-100 rounded-full h-10 w-10 flex items-center justify-center mr-3 flex-shrink-0">
                            {getNotificationIcon(notification)}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h3 className="font-medium">{notification.title}</h3>
                              <span className="text-xs text-gray-400">{formatTime(notification.createdAt)}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-sm text-gray-500">
                                {getNotificationSource(notification)}
                              </span>
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="h-auto p-0 text-red-500"
                                onClick={() => handleCloseConnection(notification.connection.id)}
                              >
                                Close
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                      <Bell className="h-6 w-6 text-gray-500" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900">No Notifications</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {user?.userType === 'customer' 
                        ? 'Connect with businesses to receive notifications.'
                        : 'Connect with customers to send notifications.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      <MobileNavbar />

      {/* QR Code Modal */}
      <QRCodeModal 
        isOpen={showQRModal} 
        onClose={() => setShowQRModal(false)} 
      />

      {/* QR Scanner Modal */}
      <QRScannerModal 
        isOpen={showScannerModal} 
        onClose={() => setShowScannerModal(false)} 
      />
    </div>
  );
}