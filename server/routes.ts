import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

import { departments } from "@shared/schema";

// Swagger imports
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';

// Initialize OpenAI client


export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Serve Swagger Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Auth Routes
  app.post(api.auth.login.path, async (req, res) => {
    const { username, password, role } = req.body;

    // Simple mock auth for prototype
    const user = await storage.getUserByUsername(username);

    if (!user || user.password !== password || user.role !== role) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // In a real app, we'd issue a token/session here.
    // For prototype, we just return the user info.
    res.json(user);
  });

  app.post(api.auth.logout.path, (req, res) => {
    res.json({ message: "Logged out" });
  });

  // Patients Routes
  app.get(api.patients.list.path, async (req, res) => {
    const patients = await storage.getPatients();
    res.json(patients);
  });

  app.post(api.patients.create.path, async (req, res) => {
    try {
      const input = api.patients.create.input.parse(req.body);

      // Auto-assign department if not provided, based on diagnosis if possible?
      // For now just create
      const patient = await storage.createPatient(input);
      res.status(201).json(patient);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.patients.get.path, async (req, res) => {
    const patient = await storage.getPatient(Number(req.params.id));
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json(patient);
  });

  app.patch(api.patients.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.patients.update.input.parse(req.body);
      const updated = await storage.updatePatient(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Delete patient (discharge and remove from system)
  app.delete("/api/patients/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      await storage.deletePatient(id);
      res.json({ message: "Patient discharged and removed from system" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete patient" });
    }
  });

  // Doctors Routes
  app.get(api.doctors.list.path, async (req, res) => {
    const doctors = await storage.getDoctors();
    res.json(doctors);
  });

  // Get available doctors by department
  app.get("/api/doctors/available/:departmentId", async (req, res) => {
    try {
      const departmentId = Number(req.params.departmentId);
      const allDoctors = await storage.getDoctors();
      const availableDoctors = allDoctors.filter(d => d.isAvailable && d.departmentId === departmentId);
      res.json(availableDoctors);
    } catch (error) {
      console.error("Get available doctors error:", error);
      res.status(500).json({ message: "Failed to fetch available doctors" });
    }
  });

  // Get all available doctors (no department filter)
  app.get("/api/doctors/available", async (req, res) => {
    try {
      const allDoctors = await storage.getDoctors();
      const availableDoctors = allDoctors.filter(d => d.isAvailable);
      res.json(availableDoctors);
    } catch (error) {
      console.error("Get available doctors error:", error);
      res.status(500).json({ message: "Failed to fetch available doctors" });
    }
  });

  // Get patients assigned to a specific doctor
  app.get("/api/doctors/:doctorId/patients", async (req, res) => {
    try {
      const doctorId = Number(req.params.doctorId);
      const allPatients = await storage.getPatients();
      const doctorPatients = allPatients.filter(p => p.assignedDoctorId === doctorId);
      res.json(doctorPatients);
    } catch (error) {
      console.error("Get doctor patients error:", error);
      res.status(500).json({ message: "Failed to fetch doctor's patients" });
    }
  });

  // Departments Routes
  app.get(api.departments.list.path, async (req, res) => {
    const deps = await storage.getDepartments();
    res.json(deps);
  });

  // Stats Routes
  app.get(api.stats.distribution.path, async (req, res) => {
    const distribution = await storage.getDiseaseDistribution();

    // Map to colors for the chart
    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
    const result = distribution.map((item, index) => ({
      ...item,
      fill: colors[index % colors.length]
    }));

    res.json(result);
  });


  // AI Routes
  app.post(api.ai.predict.path, async (req, res) => {
    try {
      const { symptoms, age, gender } = req.body;
      const lowerSymptoms = symptoms.toLowerCase();

      // Safeguards for Prediction
      if (age !== undefined && (age < 0 || age > 130)) {
        return res.json({
          predictedDisease: "DATA ERROR - Invalid Age",
          confidence: 0,
          recommendedDepartment: "General Medicine",
          riskFactor: false,
          urgency: "low",
          analysis: "Age is outside valid range (0-130)."
        });
      }

      const cleanText = symptoms.replace(/[^a-zA-Z\s]/g, '');
      if (symptoms.length < 3 || cleanText.length < 3) {
        return res.json({
          predictedDisease: "DATA ERROR - Unreadable Symptoms",
          confidence: 0,
          recommendedDepartment: "General Medicine",
          riskFactor: false,
          urgency: "low",
          analysis: "Symptoms text is too short or contains only special characters."
        });
      }

      // Weighted scoring system
      const diseases = [
        // CRITICAL / EMERGENCY
        { name: "Myocardial Infarction", score: 0, dept: "Cardiology", urgency: "critical", keywords: ["chest pain", "left arm", "jaw pain", "sweating", "pressure", "crushing"] },
        { name: "Stroke", score: 0, dept: "Neurology", urgency: "critical", keywords: ["face drooping", "arm weakness", "slurred speech", "numbness", "confusion"] },
        { name: "Severe Trauma", score: 0, dept: "Orthopedics", urgency: "critical", keywords: ["accident", "unconscious", "bleeding", "severe", "crash"] },

        // HIGH URGENCY
        { name: "Hypertensive Crisis", score: 0, dept: "Cardiology", urgency: "high", keywords: ["high blood pressure", "severe headache", "nosebleed", "anxiety"] },
        { name: "Fracture", score: 0, dept: "Orthopedics", urgency: "high", keywords: ["bone", "break", "snap", "deformity", "swelling", "inability to move"] },
        { name: "Pneumonia", score: 0, dept: "General Medicine", urgency: "high", keywords: ["shortness of breath", "high fever", "chest tight"] },

        // MEDIUM URGENCY
        { name: "Migraine", score: 0, dept: "Neurology", urgency: "medium", keywords: ["headache", "sensitivity", "light", "aura", "nausea", "dizzy"] },
        { name: "Arrhythmia", score: 0, dept: "Cardiology", urgency: "medium", keywords: ["palpitations", "fluttering", "racing heart"] },
        { name: "Gastroenteritis", score: 0, dept: "General Medicine", urgency: "medium", keywords: ["vomiting", "diarrhea", "stomach pain", "cramps"] },
        { name: "Sprain/Strain", score: 0, dept: "Orthopedics", urgency: "medium", keywords: ["ligament", "twist", "pop", "bruising", "joint pain"] },

        // LOW URGENCY (Fallback)
        { name: "General Viral Infection", score: 0.1, dept: "General Medicine", urgency: "low", keywords: ["fever", "fatigue", "ache", "cough", "runny nose"] }
      ];

      // Calculate scores
      diseases.forEach(d => {
        d.keywords.forEach(k => {
          if (lowerSymptoms.includes(k)) d.score += 1;
        });
      });

      // Find best match
      diseases.sort((a, b) => b.score - a.score);
      const bestMatch = diseases[0];

      // Dynamic Confidence
      // 0 matches = 0% (but fallback has 0.1 score so it wins) -> Low confidence
      // >2 matches = High confidence
      let confidence = 50; // Base
      if (bestMatch.score >= 2) confidence = 85;
      if (bestMatch.score >= 4) confidence = 95;
      if (bestMatch.name === "General Viral Infection" && bestMatch.score < 1) confidence = 30; // Very low if falling back

      const result = {
        predictedDisease: bestMatch.name,
        confidence: confidence,
        recommendedDepartment: bestMatch.dept,
        riskFactor: bestMatch.urgency === 'critical' || bestMatch.urgency === 'high',
        urgency: bestMatch.urgency, // Explicitly sending urgency
        analysis: `AI Analysis: Symptoms match ${bestMatch.name} (${bestMatch.dept}). detected ${bestMatch.score} correlated keywords.`
      };

      res.json(result);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Prediction failed" });
    }
  });



  app.post(api.ai.autoAssign.path, async (req, res) => {
    try {
      const { patientId } = req.body;
      const patient = await storage.getPatient(patientId);

      if (!patient) return res.status(404).json({ message: "Patient not found" });

      // Infer department and diagnosis if missing
      let departmentId = patient.departmentId;
      let predictedDisease = patient.diagnosis;
      let inferredDeptName: string | undefined;

      // 1. CHECK FOR RIDICULOUS VALUES (Global Safeguards)
      let dataError = false;
      let errorReason = "";

      // Check Vitals
      const vitals = patient.vitals as any;
      if (vitals) {
        if (vitals.heartRate && (vitals.heartRate < 20 || vitals.heartRate > 300)) { dataError = true; errorReason = "Impossible Heart Rate"; }
        if (vitals.temperature && (vitals.temperature < 25 || vitals.temperature > 46)) { dataError = true; errorReason = "Fatal Temperature"; }
        if (vitals.oxygenLevel && (vitals.oxygenLevel < 30 || vitals.oxygenLevel > 100)) { dataError = true; errorReason = "Invalid Oxygen Level"; }
        if (vitals.bloodPressure) {
          const parts = vitals.bloodPressure.split('/');
          if (parts.length === 2) {
            const sys = parseInt(parts[0]);
            const dia = parseInt(parts[1]);
            if (sys > 300 || sys < 40 || dia > 200 || dia < 20) { dataError = true; errorReason = "Extreme Blood Pressure"; }
          }
        }
      }

      // Check Age (Demographics)
      if (patient.age < 0 || patient.age > 130) {
        dataError = true;
        errorReason = "Invalid Age";
      }

      // Check Symptoms (Gibberish / Malformed)
      if (!patient.symptoms || patient.symptoms.length < 3) {
        dataError = true;
        errorReason = "Insufficient Symptom Data";
      } else {
        // Check for spamming special chars or numbers only
        const cleanText = patient.symptoms.replace(/[^a-zA-Z\s]/g, '');
        if (cleanText.length < 3) {
          dataError = true;
          errorReason = "Unreadable Symptoms";
        }
      }

      // Check Name (Basic sanity)
      if (!patient.name || patient.name.length < 2 || /^\d+$/.test(patient.name)) {
        dataError = true;
        errorReason = "Invalid Name";
      }

      if (dataError) {
        predictedDisease = `DATA ERROR - ${errorReason}`;
        inferredDeptName = "General Medicine";
      }
      else if (!predictedDisease) {
        const lowerSymptoms = patient.symptoms.toLowerCase();

        // Weighted scoring system for disease prediction
        const diseases = [
          // CARDIOLOGY
          { name: "Myocardial Infarction", score: 0, dept: "Cardiology", keywords: ["chest pain", "left arm", "jaw pain", "sweating", "pressure"] },
          { name: "Arrhythmia", score: 0, dept: "Cardiology", keywords: ["palpitations", "irregular heartbeat", "fluttering", "racing heart"] },
          { name: "Hypertensive Crisis", score: 0, dept: "Cardiology", keywords: ["high blood pressure", "severe headache", "nosebleed", "anxiety"] },

          // NEUROLOGY
          { name: "Stroke", score: 0, dept: "Neurology", keywords: ["face drooping", "arm weakness", "slurred speech", "numbness", "confusion"] },
          { name: "Migraine", score: 0, dept: "Neurology", keywords: ["headache", "sensitivity", "light", "aura", "nausea"] },
          { name: "Seizure", score: 0, dept: "Neurology", keywords: ["convulsions", "loss of consciousness", "shaking", "staring"] },

          // ORTHOPEDICS
          { name: "Fracture", score: 0, dept: "Orthopedics", keywords: ["bone", "break", "snap", "deformity", "swelling", "inability to move"] },
          { name: "Sprain/Strain", score: 0, dept: "Orthopedics", keywords: ["ligament", "twist", "pop", "bruising", "joint pain"] },

          // GENERAL / RESPIRATORY
          { name: "Pneumonia", score: 0, dept: "General Medicine", keywords: ["cough", "fever", "chills", "shortness of breath", "phlegm"] },
          { name: "Gastroenteritis", score: 0, dept: "General Medicine", keywords: ["vomiting", "diarrhea", "stomach pain", "cramps"] },
          { name: "General Viral Infection", score: 0.1, dept: "General Medicine", keywords: ["fever", "fatigue", "ache"] } // fallback with low base score
        ];

        // Calculate scores
        diseases.forEach(d => {
          d.keywords.forEach(k => {
            if (lowerSymptoms.includes(k)) d.score += 1;
          });
        });

        // specific keywords weight more
        if (lowerSymptoms.includes("heart")) diseases.find(d => d.name === "Myocardial Infarction")!.score += 2;
        if (lowerSymptoms.includes("chest")) diseases.find(d => d.name === "Myocardial Infarction")!.score += 1;
        if (lowerSymptoms.includes("head")) diseases.find(d => d.name === "Migraine")!.score += 1;
        if (lowerSymptoms.includes("bone")) diseases.find(d => d.name === "Fracture")!.score += 2;

        // Find best match
        diseases.sort((a, b) => b.score - a.score);
        const bestMatch = diseases[0];

        if (bestMatch.score > 0) {
          predictedDisease = bestMatch.name;
          inferredDeptName = bestMatch.dept;
        } else {
          predictedDisease = "Undiagnosed / Call Doctor";
          inferredDeptName = "General Medicine";
        }
      }

      const departments = await storage.getDepartments();
      if (!departmentId) {
        // Map inferred department name to ID
        let targetDeptName = "General Medicine";

        if (inferredDeptName) {
          targetDeptName = inferredDeptName;
        } else if (predictedDisease) {
          // Fallback if we have diagnosis but no department (e.g. from older data)
          if (predictedDisease.includes("Cardio") || predictedDisease.includes("Heart") || predictedDisease.includes("Myocardial") || predictedDisease.includes("Arrhythmia") || predictedDisease.includes("Hyperten")) targetDeptName = "Cardiology";
          else if (predictedDisease.includes("Neuro") || predictedDisease.includes("Migraine") || predictedDisease.includes("Stroke") || predictedDisease.includes("Seizure")) targetDeptName = "Neurology";
          else if (predictedDisease.includes("Ortho") || predictedDisease.includes("Fracture") || predictedDisease.includes("Bone") || predictedDisease.includes("Sprain")) targetDeptName = "Orthopedics";
        }

        departmentId = departments.find(d => d.name === targetDeptName)?.id || null;
      }

      if (!departmentId) {
        // Fallback to General or first available
        departmentId = departments[0]?.id || null;
      }

      const allDoctors = await storage.getDoctors();
      const availableDoctor = allDoctors.find(d =>
        d.departmentId === departmentId && d.isAvailable
      );

      if (availableDoctor) {
        // Assign doctor and update diagnosis and department
        await storage.updatePatient(patientId, {
          assignedDoctorId: availableDoctor.id,
          status: 'in-treatment',
          diagnosis: predictedDisease,
          departmentId: departmentId
        });

        res.json({
          doctorId: availableDoctor.id,
          doctorName: availableDoctor.name,
          roomNumber: availableDoctor.roomNumber || "TBD",
          predictedDisease: predictedDisease,
          message: `Successfully assigned to Dr. ${availableDoctor.name}`
        });
      } else {
        res.status(404).json({ message: "No available doctors in this department" });
      }

    } catch (error) {
      console.error("Auto assign error:", error);
      res.status(500).json({ message: "Failed to assign doctor" });
    }
  });

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const users = await storage.getUserByUsername("admin");
  if (!users) {
    // Create Users
    await storage.createUser({ username: "admin", password: "admin", role: "admin", name: "System Admin" });
    await storage.createUser({ username: "doc", password: "doc", role: "doctor", name: "Dr. Smith" });
    await storage.createUser({ username: "amb", password: "amb", role: "ambulance", name: "Unit 1" });

    // Create Departments
    const card = await storage.createDepartment({ name: "Cardiology" });
    const neuro = await storage.createDepartment({ name: "Neurology" });
    const ortho = await storage.createDepartment({ name: "Orthopedics" });
    const general = await storage.createDepartment({ name: "General Medicine" });

    // Create Doctors
    await storage.createDoctor({ name: "Dr. Sarah Johnson", specialty: "Cardiologist", departmentId: card.id, roomNumber: "101", isAvailable: true });
    await storage.createDoctor({ name: "Dr. Mike Chen", specialty: "Neurologist", departmentId: neuro.id, roomNumber: "202", isAvailable: true });
    await storage.createDoctor({ name: "Dr. Emily Davis", specialty: "Orthopedic Surgeon", departmentId: ortho.id, roomNumber: "305", isAvailable: true });

    // Create Patients
    await storage.createPatient({
      name: "John Doe",
      age: 45,
      gender: "Male",
      symptoms: "Chest pain, shortness of breath",
      urgency: "high",
      status: "transporting",
      departmentId: card.id,
      riskFactor: true,
      vitals: { heartRate: 110, bloodPressure: "150/90" }
    });

    await storage.createPatient({
      name: "Jane Smith",
      age: 28,
      gender: "Female",
      symptoms: "Migraine, dizziness",
      urgency: "medium",
      status: "transporting",
      departmentId: neuro.id,
      riskFactor: false,
      vitals: { heartRate: 85, bloodPressure: "120/80" }
    });
  }
}
