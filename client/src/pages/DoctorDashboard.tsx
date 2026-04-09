import { useAuth } from "@/hooks/use-auth";
import { useDoctorPatients, useDischargePatient } from "@/hooks/use-doctor-patients";
import { useDoctors, useDepartments } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogOut, User, Activity, Clock, FileText, AlertTriangle, Building2, Calendar, History } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  // "My Patients" Data
  const doctorId = 1; // Demo ID
  const { data: myPatients, isLoading: patientsLoading } = useDoctorPatients(doctorId);
  const dischargePatient = useDischargePatient();

  // "Directory" Data
  const { data: allDoctors } = useDoctors();
  const { data: departments } = useDepartments();

  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [dischargeDialogOpen, setDischargeDialogOpen] = useState(false);

  // Directory State
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  if (!user || user.role !== 'doctor') {
    setLocation('/');
    return null;
  }

  const handleDischarge = async () => {
    if (!selectedPatient) return;
    try {
      await dischargePatient.mutateAsync(selectedPatient.id);
      toast({
        title: "Patient Discharged",
        description: `${selectedPatient.name} has been successfully discharged.`,
      });
      setDischargeDialogOpen(false);
      setSelectedPatient(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to discharge patient", variant: "destructive" });
    }
  };

  // Group Doctors by Department
  const groupedDoctors = departments?.map(dept => ({
    ...dept,
    doctors: allDoctors?.filter((d: any) => d.departmentId === dept.id) || []
  })).filter(g => g.doctors.length > 0) || [];

  // Mock Data for selected doctor
  const mockSlots = [
    "09:00 AM - 10:00 AM",
    "11:30 AM - 12:30 PM",
    "02:00 PM - 03:00 PM",
    "04:15 PM - 04:45 PM"
  ];
  const mockHistory = [
    { id: 101, name: "Alice Smith", date: "Jan 20, 2024", diagnosis: "Migraine", status: "Discharged" },
    { id: 102, name: "Bob Jones", date: "Jan 18, 2024", diagnosis: "Hypertension", status: "Discharged" },
    { id: 103, name: "Charlie Day", date: "Jan 15, 2024", diagnosis: "Fracture", status: "Referred" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <h1 className="text-xl font-bold font-display text-purple-900">Medical Portal</h1>
        <div className="flex items-center gap-4">
          <div className="flex flex-col text-right">
            <span className="text-sm font-bold text-slate-800">Dr. {user.name}</span>
            <span className="text-xs text-slate-500">Cardiology Dept</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { logout(); setLocation('/'); }}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="patients" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="patients">My Patients</TabsTrigger>
            <TabsTrigger value="directory">Doctor Directory</TabsTrigger>
          </TabsList>

          {/* TAB 1: MY PATIENTS */}
          <TabsContent value="patients" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold font-display">Currently Treating</h2>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {myPatients?.length || 0} Active Patients
              </Badge>
            </div>

            {patientsLoading ? (
              <div className="text-center py-20">Loading patients...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myPatients?.map((patient: any) => (
                  <Card key={patient.id} className="hover:shadow-lg transition-shadow border-t-4 border-t-purple-500">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{patient.name}</CardTitle>
                          <CardDescription>{patient.gender}, {patient.age} years</CardDescription>
                        </div>
                        <Badge variant={patient.urgency === 'critical' || patient.urgency === 'high' ? 'destructive' : 'secondary'}>
                          {patient.urgency}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {/* Vitals & Status */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-slate-600">
                          <Activity className="w-4 h-4 mr-2 text-emerald-500" />
                          <span>BP: {patient.vitals?.bloodPressure || 'N/A'}</span>
                          <span className="mx-2">•</span>
                          <span>HR: {patient.vitals?.heartRate || 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-slate-600">
                          <FileText className="w-4 h-4 mr-2 text-blue-500" />
                          <span className="font-medium">{patient.diagnosis || 'Undiagnosed'}</span>
                        </div>
                      </div>
                      <div className="pt-2">
                        <p className="text-xs font-semibold text-slate-500 mb-1">SYMPTOMS</p>
                        <p className="text-sm text-slate-700">{patient.symptoms}</p>
                      </div>
                      <div className="pt-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <p className="text-xs font-semibold text-blue-700 mb-1">STATUS</p>
                        <Badge className="bg-blue-600 capitalize">{patient.status}</Badge>
                      </div>
                      <Button
                        className="w-full bg-red-600 hover:bg-red-700"
                        onClick={() => { setSelectedPatient(patient); setDischargeDialogOpen(true); }}
                      >
                        Discharge Patient
                      </Button>
                    </CardContent>
                  </Card>
                ))}

                {!patientsLoading && (!myPatients || myPatients.length === 0) && (
                  <div className="col-span-full text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                    <User className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No active patients</h3>
                    <p className="text-slate-500">You currently have no patients assigned to you.</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: DOCTOR DIRECTORY */}
          <TabsContent value="directory">
            <div className="space-y-8">
              {groupedDoctors.map((dept: any) => (
                <div key={dept.id} className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Building2 className="h-6 w-6 text-purple-600" />
                    <h3 className="text-2xl font-bold text-slate-800">{dept.name}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dept.doctors.map((doc: any) => (
                      <Card
                        key={doc.id}
                        className="cursor-pointer hover:border-purple-400 hover:shadow-md transition-all group"
                        onClick={() => { setSelectedDoctor(doc); setProfileOpen(true); }}
                      >
                        <CardHeader className="flex flex-row items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            {doc.name.charAt(0)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{doc.name}</CardTitle>
                            <CardDescription className="text-xs font-medium uppercase tracking-wider text-purple-600">
                              {doc.specialty}
                            </CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm text-slate-600">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              <span>Room: {doc.roomNumber}</span>
                            </div>
                            <div className="flex items-center">
                              <Activity className="h-4 w-4 mr-2" />
                              <span>Status: </span>
                              <Badge variant="outline" className={`ml-2 ${doc.isAvailable ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'}`}>
                                {doc.isAvailable ? 'Available' : 'Busy'}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* DISCHARGE DIALOG (Existing) */}
      <Dialog open={dischargeDialogOpen} onOpenChange={setDischargeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" /> Discharge Patient
            </DialogTitle>
            <DialogDescription>Are you sure you want to discharge <strong>{selectedPatient?.name}</strong>?</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
              <strong>Warning:</strong> This will permanently remove the patient from the system.
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDischargeDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleDischarge} className="flex-1 bg-red-600 hover:bg-red-700">Confirm Discharge</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DOCTOR PROFILE DIALOG (New) */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm">
                DR
              </div>
              {selectedDoctor?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedDoctor?.specialty} • {departments?.find((d: any) => d.id === selectedDoctor?.departmentId)?.name}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="slots" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="slots">Availability Slots</TabsTrigger>
              <TabsTrigger value="history">Patient History</TabsTrigger>
            </TabsList>

            <TabsContent value="slots" className="min-h-[200px] p-4">
              <div className="flex items-center gap-2 mb-4 text-slate-700 font-semibold">
                <Calendar className="h-5 w-5 text-purple-600" />
                Today's Availability
              </div>
              <div className="grid grid-cols-2 gap-3">
                {mockSlots.map((slot, i) => (
                  <div key={i} className="p-3 border rounded-lg hover:border-purple-500 hover:bg-purple-50 cursor-pointer text-center text-sm font-medium transition-all">
                    {slot}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">* Slots update in real-time based on appointments.</p>
            </TabsContent>

            <TabsContent value="history" className="min-h-[200px] p-4">
              <div className="flex items-center gap-2 mb-4 text-slate-700 font-semibold">
                <History className="h-5 w-5 text-blue-600" />
                Recent Cases
              </div>
              <ScrollArea className="h-[200px]">
                <div className="space-y-3">
                  {mockHistory.map((record) => (
                    <div key={record.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border">
                      <div>
                        <p className="font-bold text-slate-800">{record.name}</p>
                        <p className="text-xs text-slate-500">{record.date}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{record.diagnosis}</Badge>
                        <p className="text-xs text-green-600 font-medium mt-1">{record.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
