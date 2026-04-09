import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useDoctorPatients(doctorId: number) {
    return useQuery({
        queryKey: ["doctor-patients", doctorId],
        queryFn: async () => {
            const res = await fetch(`/api/doctors/${doctorId}/patients`);
            if (!res.ok) throw new Error("Failed to fetch patients");
            return res.json();
        },
        refetchInterval: 5000,
    });
}

export function useUpdatePatientStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ patientId, status }: { patientId: number; status: string }) => {
            const res = await fetch(`/api/patients/${patientId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error("Failed to update status");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["doctor-patients"] });
            queryClient.invalidateQueries({ queryKey: ["patients"] });
        },
    });
}

export function useDischargePatient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (patientId: number) => {
            const res = await fetch(`/api/patients/${patientId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to discharge patient");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["doctor-patients"] });
            queryClient.invalidateQueries({ queryKey: ["patients"] });
            queryClient.invalidateQueries({ queryKey: ["stats"] });
        },
    });
}
