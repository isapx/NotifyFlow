import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface QRCodeProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
  className?: string;
}

export function QrCode({
  value,
  size = 256,
  level = 'M',
  includeMargin = true,
  className = ''
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    console.log("QR Code value:", value); // Debug log
    
    if (!value) {
      setError("No value provided for QR code");
      setIsLoading(false);
      return;
    }

    // Usar QRCode.toDataURL en lugar de toCanvas para tener más compatibilidad
    setIsLoading(true);
    QRCode.toDataURL(
      value,
      {
        width: size,
        margin: includeMargin ? 4 : 0,
        errorCorrectionLevel: level,
        color: {
          dark: '#000000FF',
          light: '#FFFFFFFF'
        }
      },
      (error, url) => {
        setIsLoading(false);
        if (error) {
          console.error("Error generating QR code:", error);
          setError("Failed to generate QR code");
        } else {
          setError(null);
          setQrDataUrl(url);
        }
      }
    );
  }, [value, size, level, includeMargin]);

  if (error) {
    return (
      <Card className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <div className="text-sm text-red-500 p-4 text-center">{error}</div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className={className}>
        <Skeleton className="rounded-md" style={{ width: size, height: size }} />
      </div>
    );
  }

  // Mostrar el QR como imagen y como canvas para asegurar máxima compatibilidad
  return (
    <div className={className} style={{ width: size, height: size }}>
      {qrDataUrl && (
        <>
          <img 
            src={qrDataUrl}
            alt="QR Code" 
            className="qr-code-image"
            style={{ width: size, height: size, display: 'block' }}
          />
          <canvas 
            ref={canvasRef} 
            style={{ display: 'none' }} 
            width={size} 
            height={size}
          />
        </>
      )}
    </div>
  );
}
