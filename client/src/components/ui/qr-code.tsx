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

  useEffect(() => {
    if (!value) {
      setError("No value provided for QR code");
      setIsLoading(false);
      return;
    }

    if (canvasRef.current) {
      setIsLoading(true);
      QRCode.toCanvas(
        canvasRef.current,
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
        (error) => {
          setIsLoading(false);
          if (error) {
            console.error("Error generating QR code:", error);
            setError("Failed to generate QR code");
          } else {
            setError(null);
          }
        }
      );
    }
  }, [value, size, level, includeMargin]);

  if (error) {
    return (
      <Card className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <div className="text-sm text-red-500 p-4 text-center">{error}</div>
      </Card>
    );
  }

  return (
    <div className={className}>
      {isLoading ? (
        <Skeleton className="rounded-md" style={{ width: size, height: size }} />
      ) : (
        <canvas ref={canvasRef} />
      )}
    </div>
  );
}
