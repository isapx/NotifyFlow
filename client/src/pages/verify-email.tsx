import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

enum VerificationStatus {
  LOADING,
  SUCCESS,
  ERROR
}

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<VerificationStatus>(VerificationStatus.LOADING);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get token from URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");

        if (!token) {
          setStatus(VerificationStatus.ERROR);
          setMessage("Token de verificación no encontrado en la URL");
          return;
        }

        // Call API to verify email
        const response = await apiRequest("GET", `/api/email/verify?token=${token}`);
        
        if (response.ok) {
          setStatus(VerificationStatus.SUCCESS);
          setMessage("¡Tu correo electrónico ha sido verificado correctamente!");
        } else {
          const data = await response.json();
          setStatus(VerificationStatus.ERROR);
          setMessage(data.message || "Error al verificar el correo electrónico");
        }
      } catch (error) {
        setStatus(VerificationStatus.ERROR);
        setMessage("Error al conectar con el servidor");
        console.error("Error verifying email:", error);
      }
    };

    verifyEmail();
  }, []);

  const renderContent = () => {
    switch (status) {
      case VerificationStatus.LOADING:
        return (
          <>
            <CardHeader>
              <CardTitle>Verificando tu correo electrónico</CardTitle>
              <CardDescription>
                Por favor espera mientras verificamos tu correo electrónico...
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center py-10">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </CardContent>
          </>
        );
      
      case VerificationStatus.SUCCESS:
        return (
          <>
            <CardHeader>
              <CardTitle>Verificación completada</CardTitle>
              <CardDescription>
                Tu correo electrónico ha sido verificado correctamente
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-10">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-center">{message}</p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => setLocation("/")}>
                Ir a la página principal
              </Button>
            </CardFooter>
          </>
        );
      
      case VerificationStatus.ERROR:
        return (
          <>
            <CardHeader>
              <CardTitle>Error de verificación</CardTitle>
              <CardDescription>
                No pudimos verificar tu correo electrónico
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-10">
              <XCircle className="h-16 w-16 text-destructive mb-4" />
              <p className="text-center">{message}</p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => setLocation("/")}>
                Ir a la página principal
              </Button>
            </CardFooter>
          </>
        );
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <Card className="w-full max-w-md">
        {renderContent()}
      </Card>
    </div>
  );
}