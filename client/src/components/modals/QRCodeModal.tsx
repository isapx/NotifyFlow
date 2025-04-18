import { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode } from "@/components/ui/qr-code";
import { Download, Share2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type QRCodeModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function QRCodeModal({ isOpen, onClose }: QRCodeModalProps) {
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const { toast } = useToast();
  const [qrCodeData, setQrCodeData] = useState<string>("");
  
  // Generate QR code
  const generateQrCodeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/qrcode/generate");
      return await res.json();
    },
    onSuccess: (data) => {
      setQrCodeData(data.code);
      setCountdown(300); // Reset countdown
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Generate QR code when modal opens
  useEffect(() => {
    if (isOpen) {
      generateQrCodeMutation.mutate();
    }
  }, [isOpen]);
  
  // Countdown timer
  useEffect(() => {
    if (!isOpen || !qrCodeData) return;
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isOpen, qrCodeData, onClose]);
  
  // Format countdown
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  
  // Download QR code
  const handleDownload = () => {
    // Buscar primero la imagen, si no está disponible usar el canvas
    const img = document.querySelector(".qr-code-image") as HTMLImageElement;
    const canvas = document.querySelector("canvas");
    
    let imageUrl = '';
    if (img && img.src) {
      imageUrl = img.src;
    } else if (canvas) {
      imageUrl = canvas.toDataURL("image/png");
    } else {
      toast({
        title: "Error",
        description: "No se pudo descargar el código QR. Inténtalo de nuevo.",
        variant: "destructive",
      });
      return;
    }
    
    const link = document.createElement("a");
    link.download = "notifyflow-qrcode.png";
    link.href = imageUrl;
    link.click();
    
    toast({
      title: "Código QR Descargado",
      description: "Tu código QR se ha descargado correctamente.",
    });
  };
  
  // Share QR code
  const handleShare = async () => {
    if (!navigator.share) {
      toast({
        title: "Compartir no Compatible",
        description: "Tu navegador no admite la función de compartir. Por favor, descarga y comparte manualmente.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Usar la imagen o el canvas para compartir
      const img = document.querySelector(".qr-code-image") as HTMLImageElement;
      const canvas = document.querySelector("canvas");
      
      let blob: Blob;
      
      if (img && img.src) {
        // Convertir la imagen data URL a blob
        const response = await fetch(img.src);
        blob = await response.blob();
      } else if (canvas) {
        // Convertir canvas a blob
        blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => {
            if (b) resolve(b);
            else throw new Error("No se pudo crear el blob");
          }, "image/png");
        });
      } else {
        throw new Error("No se encontró ninguna imagen de código QR");
      }
      
      await navigator.share({
        title: "Código QR de NotifyFlow",
        text: "Escanea este código QR para conectarte conmigo",
        files: [new File([blob], "notifyflow-qrcode.png", { type: "image/png" })],
      });
      
      toast({
        title: "Compartido",
        description: "Tu código QR se ha compartido correctamente.",
      });
    } catch (error) {
      console.error("Error al compartir:", error);
      toast({
        title: "Error al Compartir",
        description: "No se pudo compartir el código QR.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Your QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-4">
          {generateQrCodeMutation.isPending ? (
            <div className="w-64 h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <QrCode value={qrCodeData} size={256} />
          )}
          <p className="mt-4 text-gray-600">Show this QR code to the business to connect</p>
          <p className="text-sm text-gray-500 mt-2">This code will expire in {formatTime(countdown)}</p>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button 
            variant="outline" 
            onClick={handleDownload}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button 
            onClick={handleShare}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
