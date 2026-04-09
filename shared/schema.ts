import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'admin', 'doctor', 'ambulance'
  name: text("name").notNull(),
});

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // Cardiology, Neurology, Orthopedics, etc.
});

export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Link to login user if applicable
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  departmentId: integer("department_id").references(() => departments.id),
  isAvailable: boolean("is_available").default(true),
  roomNumber: text("room_number"),
  currentPatients: integer("current_patients").default(0),
});

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  symptoms: text("symptoms").notNull(),
  vitals: jsonb("vitals").$type<{
    heartRate?: number;
    bloodPressure?: string;
    temperature?: number;
    oxygenLevel?: number;
  }>(),
  urgency: text("urgency").default("low"), // 'low', 'medium', 'high', 'critical'
  riskFactor: boolean("risk_factor").default(false), // Risk one should update yes
  status: text("status").default("transporting"), // 'transporting', 'admitted', 'discharged'
  departmentId: integer("department_id").references(() => departments.id),
  assignedDoctorId: integer("assigned_doctor_id").references(() => doctors.id),
  diagnosis: text("diagnosis"),
  admittedAt: timestamp("admitted_at").defaultNow(),
});

export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id),
  predictedDisease: text("predicted_disease"),
  confidence: integer("confidence"),
  recommendedDepartment: text("recommended_department"),
  aiAnalysis: text("ai_analysis"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  department: one(departments, {
    fields: [doctors.departmentId],
    references: [departments.id],
  }),
  patients: many(patients),
  user: one(users, {
    fields: [doctors.userId],
    references: [users.id],
  }),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  department: one(departments, {
    fields: [patients.departmentId],
    references: [departments.id],
  }),
  assignedDoctor: one(doctors, {
    fields: [patients.assignedDoctorId],
    references: [doctors.id],
  }),
  predictions: many(predictions),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  doctors: many(doctors),
  patients: many(patients),
}));

// === SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertPatientSchema = createInsertSchema(patients).omit({ id: true, admittedAt: true });
export const insertDoctorSchema = createInsertSchema(doctors).omit({ id: true, currentPatients: true });
export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true });
export const insertPredictionSchema = createInsertSchema(predictions).omit({ id: true, createdAt: true });

// === TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

export type Doctor = typeof doctors.$inferSelect;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type Prediction = typeof predictions.$inferSelect;

// Request Types
export type LoginRequest = {
  username: string;
  password: string;
  role: 'admin' | 'doctor' | 'ambulance';
};

export type CreatePatientRequest = InsertPatient;
export type UpdatePatientRequest = Partial<InsertPatient>;

export type AssignDoctorRequest = {
  patientId: number;
  doctorId: number;
};

export type PredictRequest = {
  symptoms: string;
  vitals?: any;
};

export type AutoAssignRequest = {
  patientId: number;
};

// Response Types
export type AuthResponse = {
  user: User;
  token?: string; // Optional for simple auth
};

export type DiseaseDistribution = {
  name: string;
  value: number;
  color: string;
}[];
