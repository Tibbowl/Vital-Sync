import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCreatePatient } from "@/hooks/use-patients";
import { usePredictDisease, useAutoAssignDoctor } from "@/hooks/use-ai";
import { useDepartments } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, CheckCircle, Ambulance, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function AmbulanceDashboard() {
  const { user, logout } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const createPatient = useCreatePatient();
  const predictDisease = usePredictDisease();
  const autoAssign = useAutoAssignDoctor();

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "male",
    symptoms: "",
    heartRate: "",
    bloodPressure: "",
    temperature: "",
    oxygenLevel: "",
  });

  const [aiAnalysis, setAiAnalysis] = useState<{
    predictedDisease: string;
    urgency: string;
    riskFactor: boolean;
    recommendedDepartment: string;
    analysis: string;
  } | null>(null);

  const { data: departments } = useDepartments();

  if (!user || user.role !== 'ambulance') {
    setLocation('/');
    return null;
  }

  const handlePredict = async () => {
    if (!formData.symptoms) {
      toast({ title: "Missing Info", description: "Please enter symptoms first.", variant: "destructive" });
      return;
    }

    try {
      const result = await predictDisease.mutateAsync({
        symptoms: formData.symptoms,
        age: parseInt(formData.age) || 30,
        gender: formData.gender,
      });

      setAiAnalysis({
        predictedDisease: result.predictedDisease,
        urgency: result.urgency || (result.confidence > 80 ? 'critical' : result.confidence > 50 ? 'high' : 'medium'),
        riskFactor: result.riskFactor,
        recommendedDepartment: result.recommendedDepartment,
        analysis: result.analysis,
      });

      toast({ title: "AI Analysis Complete", description: "Symptoms analyzed and risk assessed." });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.name || !formData.age || !formData.symptoms) {
      toast({ title: "Incomplete Form", description: "Name, Age, and Symptoms are required.", variant: "destructive" });
      return;
    }

    try {
      // 1. Create Patient
      const safeParseInt = (val: string) => {
        const parsed = parseInt(val);
        return isNaN(parsed) ? undefined : parsed;
      };
      const safeParseFloat = (val: string) => {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? undefined : parsed;
      };

      const age = safeParseInt(formData.age);
      if (age === undefined) {
        toast({ title: "Invalid Age", description: "Age must be a number.", variant: "destructive" });
        return;
      }

      // Map predicted department string to ID
      let assignedDepartmentId: number | undefined;
      if (aiAnalysis?.recommendedDepartment && departments) {
        const target = departments.find((d: any) => d.name === aiAnalysis.recommendedDepartment);
        assignedDepartmentId = target?.id;

        // Fallback: If AI says "Cardiology" but we can't find it, try matching names roughly
        if (!assignedDepartmentId) {
          assignedDepartmentId = departments.find((d: any) => aiAnalysis.recommendedDepartment.includes(d.name))?.id;
        }
      }

      await createPatient.mutateAsync({
        name: formData.name,
        age: age,
        gender: formData.gender,
        symptoms: formData.symptoms,
        vitals: {
          heartRate: safeParseInt(formData.heartRate),
          bloodPressure: formData.bloodPressure || undefined,
          temperature: safeParseFloat(formData.temperature),
          oxygenLevel: safeParseInt(formData.oxygenLevel),
        },
        urgency: aiAnalysis?.urgency || 'medium',
        riskFactor: aiAnalysis?.riskFactor || false,
        status: 'transporting',
        diagnosis: aiAnalysis?.predictedDisease,
        departmentId: assignedDepartmentId // Now checking and sending explicit ID!
      });

      toast({
        title: "Patient Admitted",
        description: `Patient registered to ${aiAnalysis?.recommendedDepartment || "General Medicine"}.`
      });

      // Reset
      setFormData({
        name: "", age: "", gender: "male", symptoms: "",
        heartRate: "", bloodPressure: "", temperature: "", oxygenLevel: ""
      });
      setAiAnalysis(null);

    } catch (e) {
      console.error("Submission failed", e);
      toast({ title: "Submission Failed", description: "Could not create patient record. Check inputs.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <nav className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <Ambulance className="h-6 w-6" />
          <h1 className="text-xl font-bold font-display">Ambulance Portal</h1>
        </div>
        <Button variant="ghost" className="text-white hover:bg-blue-700" onClick={() => { logout(); setLocation('/'); }}>
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Patient Form */}
          <Card className="shadow-lg border-none">
            <CardHeader className="bg-blue-50/50 pb-4">
              <CardTitle className="text-blue-900">New Emergency Case</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Patient Name</Label>
                  <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input type="number" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} placeholder="35" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={formData.gender} onValueChange={v => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Observed Symptoms</Label>
                <Textarea
                  value={formData.symptoms}
                  onChange={e => setFormData({ ...formData, symptoms: e.target.value })}
                  placeholder="Describe patient condition, pain points, duration..."
                  className="h-24"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border space-y-4">
                <Label className="text-slate-500 font-semibold">Vitals Monitor</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Heart Rate (BPM)</Label>
                    <Input value={formData.heartRate} onChange={e => setFormData({ ...formData, heartRate: e.target.value })} placeholder="80" />
                  </div>
                  <div>
                    <Label className="text-xs">BP (mmHg)</Label>
                    <Input value={formData.bloodPressure} onChange={e => setFormData({ ...formData, bloodPressure: e.target.value })} placeholder="120/80" />
                  </div>
                  <div>
                    <Label className="text-xs">Temp (°C)</Label>
                    <Input value={formData.temperature} onChange={e => setFormData({ ...formData, temperature: e.target.value })} placeholder="36.5" />
                  </div>
                  <div>
                    <Label className="text-xs">SpO2 (%)</Label>
                    <Input value={formData.oxygenLevel} onChange={e => setFormData({ ...formData, oxygenLevel: e.target.value })} placeholder="98" />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  onClick={handlePredict}
                  disabled={predictDisease.isPending}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {predictDisease.isPending ? <Loader2 className="animate-spin mr-2" /> : "Analyze with AI"}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createPatient.isPending || !aiAnalysis}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {createPatient.isPending ? "Submitting..." : "Admit Patient"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis Panel */}
          <div className="space-y-6">
            <Card className={`shadow - lg border - none transition - all duration - 500 ${aiAnalysis ? 'opacity-100 translate-x-0' : 'opacity-50 translate-x-4'} `}>
              <CardHeader className="bg-purple-50/50">
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded">BETA</span>
                  AI Diagnostic Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {!aiAnalysis ? (
                  <div className="text-center text-muted-foreground py-10">
                    <p>Enter symptoms and click "Analyze" to get real-time AI insights.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Predicted Condition</p>
                        <p className="text-xl font-bold text-slate-800">{aiAnalysis.predictedDisease}</p>
                      </div>
                      <div className="text-right">
                        <div className={`inline - flex items - center px - 3 py - 1 rounded - full text - sm font - bold ${aiAnalysis.riskFactor ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          } `}>
                          {aiAnalysis.riskFactor ? <AlertTriangle className="w-4 h-4 mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                          {aiAnalysis.riskFactor ? 'High Risk' : 'Standard Risk'}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg border text-sm text-slate-600">
                      {aiAnalysis.analysis}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 border rounded bg-white">
                        <p className="text-xs text-muted-foreground">Recommended Dept</p>
                        <p className="font-semibold text-purple-700">{aiAnalysis.recommendedDepartment}</p>
                      </div>
                      <div className="p-3 border rounded bg-white">
                        <p className="text-xs text-muted-foreground">Urgency Level</p>
                        <p className={`font - semibold uppercase ${aiAnalysis.urgency === 'critical' ? 'text-red-600' : 'text-orange-600'
                          } `}>{aiAnalysis.urgency}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
