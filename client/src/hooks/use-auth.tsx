import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterData>;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  password: string;
  displayName: string;
  email: string;
  userType: "business" | "customer";
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      // Actualizar el estado del usuario en la caché
      queryClient.setQueryData(["/api/user"], user);
      
      // Mostrar notificación de inicio de sesión exitoso
      toast({
        title: "Sesión iniciada",
        description: `Bienvenido de nuevo, ${user.displayName}!`,
      });
      
      console.log("Redirigiendo al usuario a /");
      
      // Usar setTimeout para asegurar que la redirección ocurra después de la actualización del estado
      setTimeout(() => {
        window.location.href = "/"; // Redirección forzada en lugar de usar navigate
      }, 300);
    },
    onError: (error: Error) => {
      toast({
        title: "Error al iniciar sesión",
        description: error.message || "Nombre de usuario o contraseña incorrectos",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      // Actualizar el estado del usuario en la caché
      queryClient.setQueryData(["/api/user"], user);
      
      // Mostrar notificación de registro exitoso
      toast({
        title: "Registro exitoso",
        description: `Bienvenido a NotificApp, ${user.displayName}!`,
      });
      
      console.log("Redirigiendo al usuario a /");
      
      // Usar setTimeout para asegurar que la redirección ocurra después de la actualización del estado
      setTimeout(() => {
        window.location.href = "/"; // Redirección forzada en lugar de usar navigate
      }, 300);
    },
    onError: (error: Error) => {
      toast({
        title: "Error al registrarse",
        description: error.message || "No se pudo crear la cuenta. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Invalidar todas las consultas para forzar una recarga
      queryClient.clear();
      // Establecer explícitamente el usuario como null
      queryClient.setQueryData(["/api/user"], null);
      
      // Mostrar toast y redirigir
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente.",
      });
      
      console.log("Redirigiendo al usuario a /auth");
      
      // Usar redirección forzada para asegurar que ocurra
      setTimeout(() => {
        window.location.href = "/auth"; // Redirección forzada en lugar de usar navigate
      }, 300);
    },
    onError: (error: Error) => {
      toast({
        title: "Error al cerrar sesión",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
