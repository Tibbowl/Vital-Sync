import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface RoleLoginCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
  colorClass: string;
}

export function RoleLoginCard({ title, description, icon, onClick, colorClass }: RoleLoginCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="h-full flex flex-col justify-between overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className={`h-2 w-full ${colorClass}`} />
        <CardHeader>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${colorClass} bg-opacity-10 text-opacity-100`}>
            {icon}
          </div>
          <CardTitle className="text-2xl font-bold font-display">{title}</CardTitle>
          <CardDescription className="text-base mt-2">{description}</CardDescription>
        </CardHeader>
        <CardContent className="mt-auto">
          <Button 
            className={`w-full group text-white ${colorClass} hover:brightness-110 transition-all`}
            onClick={onClick}
          >
            Login as {title}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
