import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useDiseaseDistribution() {
  return useQuery({
    queryKey: [api.stats.distribution.path],
    queryFn: async () => {
      const res = await fetch(api.stats.distribution.path);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.stats.distribution.responses[200].parse(await res.json());
    },
    refetchInterval: 5000, // Real-time updates every 5s
  });
}
