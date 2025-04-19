import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, CheckCircle, XCircle, KeyRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

enum ResetStatus {
  FORM,
  SUBMITTING,
  SUCCESS,
  ERROR
}

const resetPasswordSchema = z.object({
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres")
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<ResetStatus>(ResetStatus.FORM);
  const [message, setMessage] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  });

  useEffect(() => {
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token");

    if (!tokenFromUrl) {
      setStatus(ResetStatus.ERROR);
      setMessage("Token de restablecimiento no encontrado en la URL");
    } else {
      setToken(tokenFromUrl);
    }
  }, []);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) {
      toast({
        title: "Error",
        description: "No se encontró el token de restablecimiento",
        variant: "destructive"
      });
      return;
    }

    setStatus(ResetStatus.SUBMITTING);

    try {
      const response = await apiRequest("POST", "/api/password/reset", {
        token,
        newPassword: values.password
      });

      if (response.ok) {
        setStatus(ResetStatus.SUCCESS);
        setMessage("Tu contraseña ha sido restablecida correctamente. Ahora puedes iniciar sesión con tu nueva contraseña.");
      } else {
        const data = await response.json();
        setStatus(ResetStatus.ERROR);
        setMessage(data.message || "Error al restablecer la contraseña");
      }
    } catch (error) {
      setStatus(ResetStatus.ERROR);
      setMessage("Error al conectar con el servidor");
      console.error("Error resetting password:", error);
    }
  };

  const renderContent = () => {
    switch (status) {
      case ResetStatus.FORM:
        return (
          <>
            <CardHeader>
              <CardTitle>Crear nueva contraseña</CardTitle>
              <CardDescription>
                Ingresa tu nueva contraseña para restablecer tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nueva contraseña</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormDescription>
                          Al menos 6 caracteres
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar contraseña</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full">
                    Restablecer contraseña
                  </Button>
                </form>
              </Form>
            </CardContent>
          </>
        );
      
      case ResetStatus.SUBMITTING:
        return (
          <>
            <CardHeader>
              <CardTitle>Restableciendo contraseña</CardTitle>
              <CardDescription>
                Por favor espera mientras procesamos tu solicitud...
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center py-10">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </CardContent>
          </>
        );
      
      case ResetStatus.SUCCESS:
        return (
          <>
            <CardHeader>
              <CardTitle>Contraseña restablecida</CardTitle>
              <CardDescription>
                Tu contraseña ha sido actualizada correctamente
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-10">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-center">{message}</p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => setLocation("/auth")}>
                Ir a iniciar sesión
              </Button>
            </CardFooter>
          </>
        );
      
      case ResetStatus.ERROR:
        return (
          <>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>
                No pudimos restablecer tu contraseña
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-10">
              <XCircle className="h-16 w-16 text-destructive mb-4" />
              <p className="text-center">{message}</p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => setLocation("/auth")}>
                Volver a iniciar sesión
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