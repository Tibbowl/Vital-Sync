import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useAvailableDoctors(departmentId?: number) {
    const url = departmentId
        ? `/api/doctors/available/${departmentId}`
        : `/api/doctors/available`;

    return useQuery({
        queryKey: ["available-doctors", departmentId],
        queryFn: async () => {
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch doctors");
            return res.json();
        },
        refetchInterval: 5000,
    });
}

export function useAssignDoctor() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (patientId: number) => {
            const res = await fetch("/api/ai/assign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ patientId }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to assign doctor");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["patients"] });
            queryClient.invalidateQueries({ queryKey: ["available-doctors"] });
        },
    });
}

export function useDepartments() {
    return useQuery({
        queryKey: ["departments"],
        queryFn: async () => {
            const res = await fetch("/api/departments");
            if (!res.ok) throw new Error("Failed to fetch departments");
            return res.json();
        },
    });
}

export function useDoctors() {
    return useQuery({
        queryKey: ["doctors"],
        queryFn: async () => {
            const res = await fetch("/api/doctors");
            if (!res.ok) throw new Error("Failed to fetch doctors");
            return res.json();
        },
    });
}
