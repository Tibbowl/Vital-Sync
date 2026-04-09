import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function usePredictDisease() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { symptoms: string; age?: number; gender?: string }) => {
      const res = await fetch(api.ai.predict.path, {
        method: api.ai.predict.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("AI Service Unavailable");
      return api.ai.predict.responses[200].parse(await res.json());
    },
    onError: (error) => {
      toast({ title: "Prediction Failed", description: error.message, variant: "destructive" });
    },
  });
}

export function useAutoAssignDoctor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (patientId: number) => {
      const res = await fetch(api.ai.autoAssign.path, {
        method: api.ai.autoAssign.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId }),
      });
      if (!res.ok) throw new Error("Failed to auto-assign doctor");
      return api.ai.autoAssign.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.patients.list.path] });
      toast({
        title: "Doctor Assigned",
        description: `Allocated to ${data.doctorName} in Room ${data.roomNumber}`,
      });
    },
    onError: (error) => {
      toast({ title: "Assignment Failed", description: error.message, variant: "destructive" });
    },
  });
}
