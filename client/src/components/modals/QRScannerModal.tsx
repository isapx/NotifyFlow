import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrScanner } from "@/components/ui/qr-scanner";
import { Scan, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type QRScannerModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function QRScannerModal({ isOpen, onClose }: QRScannerModalProps) {
  const { toast } = useToast();
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [serviceName, setServiceName] = useState("");
  
  // Create connection mutation
  const createConnectionMutation = useMutation({
    mutationFn: async (data: { code: string; serviceName: string }) => {
      const res = await apiRequest("POST", "/api/connections", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections/active"] });
      toast({
        title: "Connection Created",
        description: "You've successfully connected with the customer.",
      });
      resetAndClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create connection. Please try again.",
        variant: "destructive",
      });
      setScannedCode(null);
      setShowServiceDialog(false);
    },
  });
  
  // Handle QR code scan
  const handleScan = (data: string) => {
    setScannedCode(data);
    setShowServiceDialog(true);
  };
  
  // Handle scanner error
  const handleError = (error: string) => {
    toast({
      title: "Scanner Error",
      description: error,
      variant: "destructive",
    });
  };
  
  // Create connection with customer
  const handleCreateConnection = () => {
    if (!scannedCode || !serviceName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a service name.",
        variant: "destructive",
      });
      return;
    }
    
    createConnectionMutation.mutate({
      code: scannedCode,
      serviceName: serviceName.trim(),
    });
  };
  
  // Reset all state and close modal
  const resetAndClose = () => {
    setScannedCode(null);
    setShowServiceDialog(false);
    setServiceName("");
    onClose();
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Scanear Codigo QR</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-4">
            <QrScanner 
              onScan={handleScan} 
              onError={handleError}
              width={320}
              height={320}
            />
            <p className="mt-4 text-gray-600">Apunte su cámara al código QR del cliente</p>
          </div>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Escriba el nombre del servicio</AlertDialogTitle>
            <AlertDialogDescription>
              Por favor, ingrese el nombre del servicio para esta conexión (e.g., Reparación de Autos, Entrega de Flores). Esto ayudará a identificar la conexión en el futuro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="serviceName">Nombre del Servicio</Label>
              <Input
                id="serviceName"
                placeholder="e.g., Reparación de Autos, Entrega de Flores"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowServiceDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateConnection}
              disabled={createConnectionMutation.isPending || !serviceName.trim()}
            >
              {createConnectionMutation.isPending ? "Creando..." : "Crear Conexión"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
