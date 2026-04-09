import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type LoginRequest, type AuthResponse } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

// Mock user storage key (in real app, use HTTP-only cookies handled by browser)
const USER_KEY = "vital_sync_user";

export function useAuth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading } = useQuery<AuthResponse["user"] | null>({
    queryKey: ["/api/me"], // Mock endpoint for checking session
    queryFn: async () => {
      // For this demo, we check localStorage. In production, check /api/me
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    },
    staleTime: Infinity,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await res.json();
      // For demo persistence
      localStorage.setItem(USER_KEY, JSON.stringify(data));
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/me"], data);
      toast({
        title: "Welcome back",
        description: `Logged in as ${data.name} (${data.role})`,
      });
    },
    onError: (error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Simulate logout delay
      await new Promise(resolve => setTimeout(resolve, 500));
      localStorage.removeItem(USER_KEY);
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/me"], null);
      queryClient.clear(); // Clear all data on logout
      toast({
        title: "Logged out",
        description: "See you next time",
      });
    },
  });

  return {
    user,
    isLoading,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
