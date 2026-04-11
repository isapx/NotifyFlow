import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMobile } from "@/hooks/use-mobile";
import { AppNavbar } from "@/components/AppNavbar";
import { MobileNavbar } from "@/components/MobileNavbar";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { 
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle2, 
  Clock, 
  FileText,
  Store, 
  User
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function HistoryPage() {
  const { user } = useAuth();
  const isMobile = useMobile();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [timeframe, setTimeframe] = useState<string>("all");
  
  // Fetch all connections (both active and closed)
  const { data: connections, isLoading: isLoadingConnections } = useQuery({
    queryKey: ["/api/connections/active"], // This endpoint returns all connections including active ones
  });
  
  // Fetch all notifications
  const { data: notifications, isLoading: isLoadingNotifications } = useQuery({
    queryKey: ["/api/notifications"],
  });

  // Get all connections
  const allConnections = connections || [];
  
  // Filter connections based on status
  const filteredConnections = allConnections.filter((connection: any) => {
    if (filterStatus === "all") return true;
    return connection.status === filterStatus;
  });
  
  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };
  
  // Format time
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "h:mm a");
  };
  
  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  // Get entity (business or customer)
  const getConnectionEntity = (connection: any) => {
    if (user?.userType === "business") {
      return connection.customer;
    } else {
      return connection.business;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavbar />
      
      <div className="pt-16 pb-16 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Connection History</h1>
              
              <div className="flex items-center gap-2">
                <Select 
                  value={filterStatus} 
                  onValueChange={setFilterStatus}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select 
                  value={timeframe} 
                  onValueChange={setTimeframe}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {isLoadingConnections ? (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
              </Card>
            ) : filteredConnections.length > 0 ? (
              <div className={isMobile ? "space-y-4" : ""}>
                {isMobile ? (
                  filteredConnections.map((connection: any) => {
                    const entity = getConnectionEntity(connection);
                    
                    return (
                      <Card key={connection.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="bg-gray-100 rounded-full h-10 w-10 flex items-center justify-center flex-shrink-0">
                              {entity?.userType === "business" ? (
                                <Store className="h-5 w-5 text-gray-500" />
                              ) : (
                                <User className="h-5 w-5 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{entity?.displayName}</div>
                              <div className="text-sm text-gray-500">{connection.serviceName}</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-gray-500">Status:</div>
                            <div className="text-right">
                              <Badge variant={connection.status === "active" ? "success" : "secondary"}>
                                {connection.status === "active" ? "Active" : "Closed"}
                              </Badge>
                            </div>
                            
                            <div className="text-gray-500">Created:</div>
                            <div className="text-right">
                              {formatDate(connection.createdAt)}
                            </div>
                            
                            {connection.closedAt && (
                              <>
                                <div className="text-gray-500">Closed:</div>
                                <div className="text-right">
                                  {formatDate(connection.closedAt)}
                                </div>
                              </>
                            )}
                            
                            <div className="text-gray-500">Type:</div>
                            <div className="text-right">
                              {entity?.userType === "business" ? "Business" : "Customer"}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{user?.userType === "business" ? "Customer" : "Business"}</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Closed</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredConnections.map((connection: any) => {
                            const entity = getConnectionEntity(connection);
                            
                            return (
                              <TableRow key={connection.id}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <div className="bg-gray-100 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                                      {entity?.userType === "business" ? (
                                        <Store className="h-4 w-4 text-gray-500" />
                                      ) : (
                                        <User className="h-4 w-4 text-gray-500" />
                                      )}
                                    </div>
                                    <span>{entity?.displayName}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{connection.serviceName}</TableCell>
                                <TableCell>
                                  <Badge variant={connection.status === "active" ? "success" : "secondary"}>
                                    {connection.status === "active" ? "Active" : "Closed"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span>{formatDate(connection.createdAt)}</span>
                                    <span className="text-xs text-gray-500">{formatTime(connection.createdAt)}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {connection.closedAt ? (
                                    <div className="flex flex-col">
                                      <span>{formatDate(connection.closedAt)}</span>
                                      <span className="text-xs text-gray-500">{formatTime(connection.closedAt)}</span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500">-</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center py-12">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                    <FileText className="h-6 w-6 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No Connection History</h3>
                  <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                    {user?.userType === 'customer' 
                      ? 'You haven\'t connected with any businesses yet. Generate a QR code to start connecting.'
                      : 'You haven\'t connected with any customers yet. Scan a customer\'s QR code to connect.'}
                  </p>
                </CardContent>
              </Card>
            )}
            
            <h1 className="text-2xl font-bold mt-12 mb-6">Notification History</h1>
            
            {isLoadingNotifications ? (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
              </Card>
            ) : notifications && notifications.length > 0 ? (
              <div className={isMobile ? "space-y-4" : ""}>
                {isMobile ? (
                  notifications.map((notification: any) => {
                    return (
                      <Card key={notification.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-2">
                            <div className="bg-green-100 rounded-full h-10 w-10 flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                              <div className="font-medium">{notification.title}</div>
                              <div className="text-sm text-gray-500">
                                {user?.userType === "business" 
                                  ? `To: ${notification.connection.customer?.displayName}`
                                  : `From: ${notification.connection.business?.displayName}`
                                }
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-700 mb-2 pl-12">{notification.message}</p>
                          
                          <div className="pl-12 text-xs text-gray-500 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatRelativeTime(notification.createdAt)}</span>
                            </div>
                            <Badge variant={notification.isRead ? "outline" : "default"} className="text-xs">
                              {notification.isRead ? "Read" : "Unread"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead>{user?.userType === "business" ? "To" : "From"}</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {notifications.map((notification: any) => (
                            <TableRow key={notification.id}>
                              <TableCell className="font-medium">{notification.title}</TableCell>
                              <TableCell>{notification.message}</TableCell>
                              <TableCell>
                                {user?.userType === "business" 
                                  ? notification.connection.customer?.displayName
                                  : notification.connection.business?.displayName
                                }
                              </TableCell>
                              <TableCell>{notification.connection.serviceName}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span>{formatDate(notification.createdAt)}</span>
                                  <span className="text-xs text-gray-500">{formatTime(notification.createdAt)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={notification.isRead ? "outline" : "default"}>
                                  {notification.isRead ? "Read" : "Unread"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center py-12">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                    <Bell className="h-6 w-6 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No Notification History</h3>
                  <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                    {user?.userType === 'customer' 
                      ? 'You haven\'t received any notifications yet. Connect with businesses to get updates.'
                      : 'You haven\'t sent any notifications yet. Connect with customers to send updates.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      <MobileNavbar />
    </div>
  );
}
