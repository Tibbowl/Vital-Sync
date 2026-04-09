import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { RoleLoginCard } from "@/components/RoleLoginCard";
import { Ambulance, ShieldCheck, Stethoscope, HeartPulse, X, Bot, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function Login() {
  const { login, isLoggingIn, user } = useAuth();
  const [_, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'doctor' | 'ambulance' | null>(null);

  // Credentials state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Redirect if already logged in
  if (user) {
    if (user.role === 'admin') setLocation('/admin');
    else if (user.role === 'ambulance') setLocation('/ambulance');
    else if (user.role === 'doctor') setLocation('/doctor');
  }

  const handleRoleSelect = (role: 'admin' | 'doctor' | 'ambulance') => {
    setSelectedRole(role);
    // Auto-fill hints for demo
    if (role === 'admin') { setUsername('admin'); setPassword('admin'); }
    if (role === 'ambulance') { setUsername('amb'); setPassword('amb'); }
    if (role === 'doctor') { setUsername('doc'); setPassword('doc'); }
  };

  const handleLogin = () => {
    if (!selectedRole) return;
    login(
      { username, password, role: selectedRole },
      {
        onSuccess: (data) => {
          if (data.role === 'admin') setLocation('/admin');
          else if (data.role === 'ambulance') setLocation('/ambulance');
          else if (data.role === 'doctor') setLocation('/doctor');
        }
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b sticky top-0 z-10 px-6 py-4 flex items-center gap-3">
        <div className="bg-emerald-600 p-2 rounded-lg text-white">
          <HeartPulse className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold font-display text-emerald-950">VITAL SYNC</h1>
          <p className="text-xs text-muted-foreground font-medium">Emergency Management System</p>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 container mx-auto px-4 py-12 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block py-1 px-3 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold mb-6">
            Intelligent Healthcare Logistics
          </span>
          <h2 className="text-4xl md:text-6xl font-bold font-display text-slate-900 mb-6 leading-tight">
            Streamlined Emergency <span className="text-emerald-600">Patient Management</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
            Real-time patient tracking, AI-powered triage, and intelligent doctor allocation system designed for modern emergency response.
          </p>
        </motion.div>

        {/* AI Assistant Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-6xl mx-auto mb-16"
        >
          <div className="bg-white border rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
            <div className="flex-1 space-y-4 text-center md:text-left">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 py-1 px-3 gap-1.5 font-medium rounded-full">
                <Bot className="h-3.5 w-3.5" />
                Public Feature
              </Badge>
              <h3 className="text-3xl md:text-4xl font-bold font-display text-slate-900">AI Doctor Assistant</h3>
              <p className="text-lg text-slate-600 max-w-xl">
                Experience the future of triage. Enter your symptoms and vitals to get an instant AI-powered health assessment.
              </p>
            </div>
            <Button
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl h-14 px-8 text-lg font-semibold gap-2 transition-all hover:translate-x-1 shadow-lg shadow-emerald-200"
              onClick={() => setLocation('/ai-assessment')}
            >
              Try AI Doctor Now <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <RoleLoginCard
            title="Ambulance"
            description="Log vitals, symptoms, and initiate patient transport protocols."
            icon={<Ambulance className="h-8 w-8 text-emerald-600" />}
            colorClass="bg-emerald-600"
            onClick={() => handleRoleSelect('ambulance')}
          />
          <RoleLoginCard
            title="Administrator"
            description="Oversee hospital operations, doctor availability, and disease analytics."
            icon={<ShieldCheck className="h-8 w-8 text-emerald-600" />}
            colorClass="bg-emerald-600"
            onClick={() => handleRoleSelect('admin')}
          />
          <RoleLoginCard
            title="Doctor"
            description="View assigned patients, access medical history, and manage diagnosis."
            icon={<Stethoscope className="h-8 w-8 text-emerald-600" />}
            colorClass="bg-emerald-600"
            onClick={() => handleRoleSelect('doctor')}
          />
        </div>
      </main>

      {/* Login Dialog */}
      <Dialog open={!!selectedRole} onOpenChange={(open) => !open && setSelectedRole(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display flex items-center gap-2">
              Login as {(selectedRole || "").charAt(0).toUpperCase() + (selectedRole || "").slice(1)}
            </DialogTitle>
            <DialogDescription>
              Enter your credentials to access the secure portal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
            <Button
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
              size="lg"
              onClick={handleLogin}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? "Authenticating..." : "Access Portal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
