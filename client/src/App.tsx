import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/AdminDashboard";
import AmbulanceDashboard from "@/pages/AmbulanceDashboard";
import DoctorDashboard from "@/pages/DoctorDashboard";
import PublicAIAssessment from "@/pages/PublicAIAssessment";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/ai-assessment" component={PublicAIAssessment} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/ambulance" component={AmbulanceDashboard} />
      <Route path="/doctor" component={DoctorDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
