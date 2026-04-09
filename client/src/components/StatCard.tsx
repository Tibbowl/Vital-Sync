import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({ title, value, icon, description, trend }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-panel border-none shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground font-display">
            {title}
          </CardTitle>
          <div className="text-primary p-2 bg-primary/10 rounded-full">
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-display text-slate-900">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
