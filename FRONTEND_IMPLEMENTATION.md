# Frontend Implementation Guide

## Current Status

### ✅ What's Working:
- Backend API is fully functional
- Login/Authentication
- Displaying patient lists
- Displaying disease distribution stats
- Basic UI components

### ❌ What's Missing:
- Doctor dashboard button functionality
- Admin dashboard patient management features
- Real-time updates between ambulance → admin → doctor

---

## Required Frontend Changes

### 1. **Doctor Dashboard** (`DoctorDashboard.tsx`)

#### Issues:
- Line 22: Shows ALL patients instead of only assigned ones
- Lines 80-85: Buttons have no onClick handlers

#### Required Changes:

```typescript
// 1. Create a new hook to fetch doctor's patients
// File: client/src/hooks/use-doctor-patients.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useDoctorPatients(doctorId: number) {
  return useQuery({
    queryKey: ["doctor-patients", doctorId],
    queryFn: async () => {
      const res = await fetch(`/api/doctors/${doctorId}/patients`);
      if (!res.ok) throw new Error("Failed to fetch patients");
      return res.json();
    },
    refetchInterval: 5000, // Poll every 5 seconds for real-time updates
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
```

```typescript
// 2. Update DoctorDashboard.tsx

import { useDoctorPatients, useUpdatePatientStatus } from "@/hooks/use-doctor-patients";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const [_, setLocation] = useLocation();
  
  // TODO: Map user.id to actual doctor ID (for now, hardcode or use a mapping)
  const doctorId = 1; // This should come from user data
  const { data: myPatients } = useDoctorPatients(doctorId);
  const updateStatus = useUpdatePatientStatus();
  
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const handleUpdateStatus = async () => {
    if (!selectedPatient || !newStatus) return;
    
    await updateStatus.mutateAsync({
      patientId: selectedPatient.id,
      status: newStatus,
    });
    
    setStatusDialogOpen(false);
    setSelectedPatient(null);
  };

  // In the button section (lines 79-86), replace with:
  <div className="pt-2 flex gap-2">
    <Button 
      variant="outline" 
      className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
      onClick={() => setSelectedPatient(patient)}
    >
      View Details
    </Button>
    <Button 
      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
      onClick={() => {
        setSelectedPatient(patient);
        setNewStatus(patient.status);
        setStatusDialogOpen(true);
      }}
    >
      Update Status
    </Button>
  </div>

  // Add dialog at the end before closing </div>:
  <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Update Patient Status</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Patient: {selectedPatient?.name}</label>
        </div>
        <Select value={newStatus} onValueChange={setNewStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="transporting">Transporting</SelectItem>
            <SelectItem value="admitted">Admitted</SelectItem>
            <SelectItem value="discharged">Discharged</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleUpdateStatus} className="w-full">
          Update Status
        </Button>
      </div>
    </DialogContent>
  </Dialog>
}
```

---

### 2. **Admin Dashboard** (`AdminDashboard.tsx`)

#### Required: Complete Patient Management System

```typescript
// 1. Create hooks for admin functionality
// File: client/src/hooks/use-admin.ts

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
      if (!res.ok) throw new Error("Failed to assign doctor");
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
```

```typescript
// 2. Create a new component for patient management
// File: client/src/components/PatientManagement.tsx

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePatients } from "@/hooks/use-patients";
import { useAvailableDoctors, useAssignDoctor, useDepartments } from "@/hooks/use-admin";
import { UserPlus, Stethoscope } from "lucide-react";

export function PatientManagement() {
  const { data: patients } = usePatients();
  const { data: departments } = useDepartments();
  const [selectedDept, setSelectedDept] = useState<number | undefined>();
  const { data: availableDoctors } = useAvailableDoctors(selectedDept);
  const assignDoctor = useAssignDoctor();
  
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const handleAssignDoctor = async (patientId: number) => {
    try {
      const result = await assignDoctor.mutateAsync(patientId);
      alert(`Successfully assigned to ${result.doctorName} in room ${result.roomNumber}`);
      setAssignDialogOpen(false);
    } catch (error) {
      alert("Failed to assign doctor. No available doctors in this department.");
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Patient Management</span>
          <Button variant="outline" size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add New Patient
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned Doctor</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients?.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell className="font-medium">{patient.name}</TableCell>
                <TableCell>
                  {departments?.find(d => d.id === patient.departmentId)?.name || "N/A"}
                </TableCell>
                <TableCell>
                  <Badge className={
                    patient.urgency === 'critical' ? 'bg-red-500' :
                    patient.urgency === 'high' ? 'bg-orange-500' :
                    'bg-green-500'
                  }>
                    {patient.urgency}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize">{patient.status}</TableCell>
                <TableCell>
                  {patient.assignedDoctorId ? (
                    <span className="text-green-600">✓ Assigned</span>
                  ) : (
                    <span className="text-orange-600">Pending</span>
                  )}
                </TableCell>
                <TableCell>
                  {!patient.assignedDoctorId && (
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setSelectedPatient(patient);
                        setSelectedDept(patient.departmentId);
                        setAssignDialogOpen(true);
                      }}
                    >
                      <Stethoscope className="h-4 w-4 mr-1" />
                      Assign Doctor
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Doctor to {selectedPatient?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Available doctors in {departments?.find(d => d.id === selectedDept)?.name}:
                </p>
                {availableDoctors && availableDoctors.length > 0 ? (
                  <div className="space-y-2">
                    {availableDoctors.map((doctor: any) => (
                      <div key={doctor.id} className="p-3 border rounded-lg">
                        <p className="font-medium">{doctor.name}</p>
                        <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                        <p className="text-sm">Room: {doctor.roomNumber}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-red-500">No available doctors</p>
                )}
              </div>
              <Button 
                onClick={() => handleAssignDoctor(selectedPatient?.id)}
                className="w-full"
                disabled={!availableDoctors || availableDoctors.length === 0}
              >
                Auto-Assign Best Available Doctor
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
```

```typescript
// 3. Update AdminDashboard.tsx to include PatientManagement

import { PatientManagement } from "@/components/PatientManagement";

// Add after the stats cards (around line 64):
<div className="mt-8">
  <PatientManagement />
</div>
```

---

### 3. **Ambulance Dashboard** - Real-time Doctor Assignment

```typescript
// Update AmbulanceDashboard.tsx to poll for assigned doctor

import { useEffect, useState } from "react";

// After creating a patient, poll for updates:
const [createdPatientId, setCreatedPatientId] = useState<number | null>(null);
const { data: createdPatient } = useQuery({
  queryKey: ["patient", createdPatientId],
  queryFn: async () => {
    if (!createdPatientId) return null;
    const res = await fetch(`/api/patients/${createdPatientId}`);
    return res.json();
  },
  enabled: !!createdPatientId,
  refetchInterval: 3000, // Poll every 3 seconds
});

// Show assigned doctor when available:
{createdPatient?.assignedDoctorId && (
  <Alert className="bg-green-50 border-green-200">
    <CheckCircle className="h-4 w-4 text-green-600" />
    <AlertTitle>Doctor Assigned!</AlertTitle>
    <AlertDescription>
      Patient has been assigned to a doctor. Room number will be provided shortly.
    </AlertDescription>
  </Alert>
)}
```

---

## Implementation Priority

1. **HIGH PRIORITY** - Doctor Dashboard buttons (easiest, most visible)
2. **HIGH PRIORITY** - Admin Patient Management table
3. **MEDIUM** - Ambulance real-time updates
4. **LOW** - Add new patient form in admin

---

## Quick Start Commands

```bash
# The backend is already running. Just update the frontend files above.
# No need to restart the server unless you modify backend code.
```

---

## Testing the Flow

1. **Login as ambulance** (`amb/amb`)
   - Create a patient
   - Note the patient ID

2. **Login as admin** (`admin/admin`)
   - See the new patient in the table
   - Click "Assign Doctor"
   - See available doctors
   - Click "Auto-Assign"

3. **Go back to ambulance**
   - Refresh or wait for poll
   - See "Doctor Assigned" message

4. **Login as doctor** (`doc/doc`)
   - See the newly assigned patient
   - Click "Update Status"
   - Change to "Discharged"

5. **Check admin dashboard**
   - See disease distribution updated
   - See patient status changed

---

## Summary

**Backend**: ✅ 100% Complete and working
**Frontend**: ❌ Needs button handlers and new components

The backend API is fully ready. You just need to:
1. Add onClick handlers to buttons
2. Create the PatientManagement component
3. Add the new hooks for API calls
4. Implement the dialogs for user interactions

All the API endpoints are tested and working. The frontend just needs to call them!
