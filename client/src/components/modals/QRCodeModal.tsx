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
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    
    const link = document.createElement("a");
    link.download = "notifyflow-qrcode.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    
    toast({
      title: "QR Code Downloaded",
      description: "Your QR code has been downloaded successfully.",
    });
  };
  
  // Share QR code
  const handleShare = async () => {
    if (!navigator.share) {
      toast({
        title: "Sharing Not Supported",
        description: "Your browser doesn't support sharing. Please download and share manually.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Convert canvas to blob for sharing
      const canvas = document.querySelector("canvas");
      if (!canvas) return;
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, "image/png");
      });
      
      await navigator.share({
        title: "NotifyFlow QR Code",
        text: "Scan this QR code to connect with me",
        files: [new File([blob], "notifyflow-qrcode.png", { type: "image/png" })],
      });
      
      toast({
        title: "Shared",
        description: "Your QR code has been shared successfully.",
      });
    } catch (error) {
      // User cancelled or sharing failed
      console.error("Sharing failed:", error);
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
