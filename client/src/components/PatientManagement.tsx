import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePatients, useUpdatePatient } from "@/hooks/use-patients";
import { useAvailableDoctors, useAssignDoctor, useDepartments, useDoctors } from "@/hooks/use-admin";
import { Stethoscope, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function PatientManagement() {
    const { data: patients } = usePatients();
    const { data: departments } = useDepartments();
    const { data: allDoctors } = useDoctors();
    const assignDoctor = useAssignDoctor();
    const { toast } = useToast();

    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [selectedDept, setSelectedDept] = useState<number | undefined>();
    const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
    const updatePatient = useUpdatePatient();

    const handleManualAssign = async () => {
        if (!selectedDoctorId || !selectedPatient) return;
        try {
            // Manually assign
            await updatePatient.mutateAsync({
                id: selectedPatient.id,
                assignedDoctorId: selectedDoctorId,
                status: 'in-treatment' // Manual override sets to in-treatment
            });
            toast({
                title: "Manual Assignment Complete",
                description: "Doctor has been assigned successfully.",
            });
            setAssignDialogOpen(false);
            setSelectedDoctorId(null);
        } catch (error) {
            toast({ title: "Error", description: "Failed to assign doctor", variant: "destructive" });
        }
    };

    // Existing logic
    const { data: availableDoctors } = useAvailableDoctors(selectedDept);

    const handleAssignDoctor = async (patientId: number) => {
        try {
            const result = await assignDoctor.mutateAsync(patientId);
            toast({
                title: "Doctor Assigned Successfully!",
                description: (
                    <div className="space-y-1">
                        <p><strong>Doctor:</strong> {result.doctorName}</p>
                        <p><strong>Room:</strong> {result.roomNumber}</p>
                        <p><strong>Diagnosis:</strong> {result.predictedDisease}</p>
                    </div>
                ),
            });
            setAssignDialogOpen(false);
        } catch (error: any) {
            toast({
                title: "Assignment Failed",
                description: error.message || "No available doctors in this department.",
                variant: "destructive",
            });
        }
    };

    const getDoctorName = (doctorId: number | null) => {
        if (!doctorId) return null;
        const doctor = allDoctors?.find((d: any) => d.id === doctorId);
        return doctor?.name;
    };

    const getDepartmentName = (deptId: number | null) => {
        if (!deptId) return "N/A";
        const dept = departments?.find((d: any) => d.id === deptId);
        return dept?.name || "N/A";
    };

    // Filter to show ONLY unassigned patients
    const pendingPatients = patients?.filter((p: any) => !p.assignedDoctorId) || [];

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Pending Patient Assignments</span>
                    <Badge variant="outline" className="text-sm">
                        {pendingPatients.length} Waiting
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="font-semibold">Patient</TableHead>
                                <TableHead className="font-semibold">Disease/Diagnosis</TableHead>
                                <TableHead className="font-semibold">Department</TableHead>
                                <TableHead className="font-semibold">Urgency</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingPatients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-2" />
                                        <p>All patients have been assigned!</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pendingPatients.map((patient: any) => (
                                    <TableRow key={patient.id} className="hover:bg-slate-50">
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{patient.name}</p>
                                                <p className="text-xs text-muted-foreground">{patient.gender}, {patient.age}y</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {patient.diagnosis ? (
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle className="h-4 w-4 text-blue-500" />
                                                    <span className="font-medium text-sm">{patient.diagnosis}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm italic">Pending diagnosis</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {getDepartmentName(patient.departmentId)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={
                                                patient.urgency === 'critical' || patient.urgency === 'high' ? 'bg-red-500' :
                                                    patient.urgency === 'medium' ? 'bg-orange-500' :
                                                        'bg-green-500'
                                            }>
                                                {patient.urgency}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="capitalize">{patient.status}</TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                size="sm"
                                                className="bg-blue-600 hover:bg-blue-700"
                                                onClick={() => {
                                                    setSelectedPatient(patient);
                                                    // Default to general or infer if missing department
                                                    setSelectedDept(patient.departmentId);
                                                    setSelectedDoctorId(null);
                                                    setAssignDialogOpen(true);
                                                }}
                                            >
                                                <Stethoscope className="h-4 w-4 mr-1" />
                                                Assign Patient
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Assign Doctor to {selectedPatient?.name}</DialogTitle>
                            <DialogDescription>
                                <div className="space-y-1 mt-2">
                                    <p><strong>Department:</strong> {getDepartmentName(selectedDept ?? null)}</p>
                                    <p><strong>Symptoms:</strong> {selectedPatient?.symptoms}</p>
                                    {selectedPatient?.diagnosis && (
                                        <p><strong>Predicted Disease:</strong> {selectedPatient.diagnosis}</p>
                                    )}
                                </div>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-semibold mb-3">
                                    Select a Doctor ({availableDoctors?.length || 0} Available):
                                </p>
                                {availableDoctors && availableDoctors.length > 0 ? (
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {availableDoctors.map((doctor: any) => (
                                            <div
                                                key={doctor.id}
                                                onClick={() => setSelectedDoctorId(doctor.id)}
                                                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedDoctorId === doctor.id
                                                    ? "bg-blue-100 border-blue-500 shadow-md"
                                                    : "bg-slate-50 hover:bg-blue-50 hover:border-blue-300"
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-semibold text-lg">{doctor.name}</p>
                                                        <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                                                        <p className="text-sm mt-1">
                                                            <span className="font-medium">Room:</span> {doctor.roomNumber}
                                                        </p>
                                                        {doctor.department && (
                                                            <p className="text-sm">
                                                                <span className="font-medium">Department:</span> {doctor.department.name}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {selectedDoctorId === doctor.id ? (
                                                        <CheckCircle className="h-6 w-6 text-blue-600" />
                                                    ) : (
                                                        <Badge className="bg-green-500">Available</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                        <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-2" />
                                        <p className="text-sm font-medium text-red-600">No available doctors found</p>
                                        <p className="text-xs text-muted-foreground mt-1">Try changing departments or contact admin</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                {selectedDoctorId ? (
                                    <Button
                                        onClick={handleManualAssign}
                                        className="w-full bg-green-600 hover:bg-green-700"
                                        disabled={updatePatient.isPending}
                                    >
                                        {updatePatient.isPending ? "Assigning..." : "✓ Confirm Assignment"}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => handleAssignDoctor(selectedPatient?.id)}
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                        disabled={!availableDoctors || availableDoctors.length === 0 || assignDoctor.isPending}
                                    >
                                        {assignDoctor.isPending ? "Auto-Assigning..." : "✨ Auto-Assign Best Available"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
