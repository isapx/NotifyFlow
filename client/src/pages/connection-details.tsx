
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AppNavbar } from "@/components/AppNavbar";
import { MobileNavbar } from "@/components/MobileNavbar";
import { useAuth } from "@/hooks/use-auth";
import { useMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, User, Clock, Calendar } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export default function ConnectionDetailsPage() {
  const { connectionId } = useParams();
  const { user } = useAuth();
  const isMobile = useMobile();

  const { data: connection, isLoading } = useQuery({
    queryKey: [`/api/connections/${connectionId}`],
  });

  const getConnectionEntity = (connection: any) => {
    if (user?.userType === "business") {
      return connection.customer;
    } else {
      return connection.business;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "h:mm a");
  };

  const formatRelativeTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!connection) {
    return <div>Connection not found</div>;
  }

  const entity = getConnectionEntity(connection);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNavbar />
      
      <div className="pt-16 pb-16 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card>
            <CardHeader>
              <CardTitle>Connection Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 rounded-full h-16 w-16 flex items-center justify-center">
                  {entity?.userType === "business" ? (
                    <Store className="h-8 w-8 text-gray-500" />
                  ) : (
                    <User className="h-8 w-8 text-gray-500" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{entity?.displayName}</h2>
                  <p className="text-gray-500">{connection.serviceName}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Status</div>
                  <Badge variant={connection.status === "active" ? "success" : "secondary"}>
                    {connection.status === "active" ? "Active" : "Closed"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Connection Type</div>
                  <div>{entity?.userType === "business" ? "Business" : "Customer"}</div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Created</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{formatDate(connection.createdAt)}</span>
                    <Clock className="h-4 w-4 text-gray-400 ml-2" />
                    <span>{formatTime(connection.createdAt)}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatRelativeTime(connection.createdAt)}
                  </div>
                </div>

                {connection.closedAt && (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500">Closed</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{formatDate(connection.closedAt)}</span>
                      <Clock className="h-4 w-4 text-gray-400 ml-2" />
                      <span>{formatTime(connection.closedAt)}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatRelativeTime(connection.closedAt)}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <MobileNavbar />
    </div>
  );
}
