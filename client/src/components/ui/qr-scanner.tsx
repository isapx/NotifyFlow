import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type QrScannerProps = {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  width?: number;
  height?: number;
  className?: string;
};

export function QrScanner({ 
  onScan,
  onError,
  width = 320,
  height = 320,
  className = ''
}: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFlash, setHasFlash] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startScanner = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser doesn't support camera access");
      }

      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: width },
          height: { ideal: height }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      // Check if flash is available
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      setHasFlash(capabilities.torch || false);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        setupQrScanning(videoRef.current);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const setupQrScanning = async (videoElement: HTMLVideoElement) => {
    try {
      // Dynamically import jsQR for smaller bundle size
      const jsQR = (await import('jsqr')).default;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not create canvas context');
      }

      canvas.width = width;
      canvas.height = height;

      const scanQrCode = () => {
        if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
          context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code) {
            onScan(code.data);
            return;
          }
        }
        
        requestAnimationFrame(scanQrCode);
      };

      requestAnimationFrame(scanQrCode);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize QR scanner';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    }
  };

  const toggleFlash = async () => {
    if (!stream) return;
    
    try {
      const track = stream.getVideoTracks()[0];
      const newFlashState = !isFlashOn;
      
      // Check if torch is supported
      await track.applyConstraints({
        advanced: [{ torch: newFlashState }]
      });
      
      setIsFlashOn(newFlashState);
    } catch (err) {
      const errorMessage = 'Failed to toggle flash';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    }
  };

  useEffect(() => {
    startScanner();
    
    return () => {
      // Clean up: stop all tracks when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <Card className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10 p-4">
          <div className="text-white text-center">
            <p className="mb-2">{error}</p>
            <Button onClick={startScanner} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </div>
      )}
      
      <video 
        ref={videoRef} 
        style={{ width, height, objectFit: 'cover' }} 
        muted
        playsInline
      />
      
      {hasFlash && (
        <Button 
          className="absolute bottom-4 right-4"
          size="sm"
          variant={isFlashOn ? "default" : "outline"}
          onClick={toggleFlash}
        >
          {isFlashOn ? "Flash Off" : "Flash On"}
        </Button>
      )}
    </Card>
  );
}
