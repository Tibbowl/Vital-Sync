import { db } from "./db";
import {
  users, patients, doctors, departments, predictions,
  type User, type InsertUser,
  type Patient, type InsertPatient, type UpdatePatientRequest,
  type Doctor, type InsertDoctor,
  type Department, type InsertDepartment,
  type Prediction
} from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Patients
  getPatients(): Promise<Patient[]>;
  getPatient(id: number): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: UpdatePatientRequest): Promise<Patient>;
  deletePatient(id: number): Promise<void>;

  // Doctors
  getDoctors(): Promise<(Doctor & { department?: Department })[]>;
  getDoctor(id: number): Promise<Doctor | undefined>;
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  updateDoctorStatus(id: number, isAvailable: boolean): Promise<Doctor>;

  // Departments
  getDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;

  // Stats
  getDiseaseDistribution(): Promise<{ name: string, value: number }[]>;

  // Predictions
  createPrediction(prediction: any): Promise<Prediction>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db!.insert(users).values(insertUser).returning();
    return user;
  }

  // Patients
  async getPatients(): Promise<Patient[]> {
    return await db!.select().from(patients).orderBy(sql`${patients.admittedAt} DESC`);
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    const [patient] = await db!.select().from(patients).where(eq(patients.id, id));
    return patient;
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const [patient] = await db!.insert(patients).values(insertPatient).returning();
    return patient;
  }

  async updatePatient(id: number, updates: UpdatePatientRequest): Promise<Patient> {
    const [updated] = await db!.update(patients)
      .set(updates)
      .where(eq(patients.id, id))
      .returning();
    return updated;
  }

  async deletePatient(id: number): Promise<void> {
    await db!.delete(patients).where(eq(patients.id, id));
  }

  // Doctors
  async getDoctors(): Promise<(Doctor & { department?: Department })[]> {
    const result = await db!.select({
      doctor: doctors,
      department: departments,
    })
      .from(doctors)
      .leftJoin(departments, eq(doctors.departmentId, departments.id));

    return result.map(({ doctor, department }) => ({
      ...doctor,
      department: department || undefined,
    }));
  }

  async getDoctor(id: number): Promise<Doctor | undefined> {
    const [doctor] = await db!.select().from(doctors).where(eq(doctors.id, id));
    return doctor;
  }

  async createDoctor(insertDoctor: InsertDoctor): Promise<Doctor> {
    const [doctor] = await db!.insert(doctors).values(insertDoctor).returning();
    return doctor;
  }

  async updateDoctorStatus(id: number, isAvailable: boolean): Promise<Doctor> {
    const [updated] = await db!.update(doctors)
      .set({ isAvailable })
      .where(eq(doctors.id, id))
      .returning();
    return updated;
  }

  // Departments
  async getDepartments(): Promise<Department[]> {
    return await db!.select().from(departments);
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const [department] = await db!.insert(departments).values(insertDepartment).returning();
    return department;
  }

  // Stats
  async getDiseaseDistribution(): Promise<{ name: string, value: number }[]> {
    // Let's count patients per department
    const result = await db!.select({
      name: departments.name,
      value: sql<number>`count(${patients.id})::int`
    })
      .from(departments)
      .leftJoin(patients, eq(patients.departmentId, departments.id))
      .groupBy(departments.name);

    return result;
  }

  // Predictions
  async createPrediction(prediction: any): Promise<Prediction> {
    const [pred] = await db!.insert(predictions).values(prediction).returning();
    return pred;
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private patients: Map<number, Patient>;
  private doctors: Map<number, Doctor>;
  private departments: Map<number, Department>;
  private predictions: Map<number, Prediction>;
  private currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.doctors = new Map();
    this.departments = new Map();
    this.predictions = new Map();
    this.currentId = { users: 1, patients: 1, doctors: 1, departments: 1, predictions: 1 };
  }

  private getId(key: string): number { return this.currentId[key]++; }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.getId('users');
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values()).sort((a, b) =>
      (b.admittedAt?.getTime() || 0) - (a.admittedAt?.getTime() || 0)
    );
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = this.getId('patients');
    const patient: Patient = {
      ...insertPatient,
      id,
      vitals: insertPatient.vitals || null,
      diagnosis: insertPatient.diagnosis || null,
      urgency: insertPatient.urgency || "low",
      riskFactor: insertPatient.riskFactor || false,
      status: insertPatient.status || "transporting",
      departmentId: insertPatient.departmentId || null,
      assignedDoctorId: insertPatient.assignedDoctorId || null,
      admittedAt: new Date(),
    };
    this.patients.set(id, patient);
    return patient;
  }

  async updatePatient(id: number, updates: UpdatePatientRequest): Promise<Patient> {
    const patient = this.patients.get(id);
    if (!patient) throw new Error("Patient not found");
    const updated = { ...patient, ...updates };
    this.patients.set(id, updated);
    return updated;
  }

  async deletePatient(id: number): Promise<void> {
    this.patients.delete(id);
  }

  async getDoctors(): Promise<(Doctor & { department?: Department })[]> {
    return Array.from(this.doctors.values()).map(d => ({
      ...d,
      department: d.departmentId ? this.departments.get(d.departmentId) : undefined
    }));
  }

  async getDoctor(id: number): Promise<Doctor | undefined> {
    return this.doctors.get(id);
  }

  async createDoctor(insertDoctor: InsertDoctor): Promise<Doctor> {
    const id = this.getId('doctors');
    const doctor: Doctor = {
      ...insertDoctor,
      id,
      isAvailable: insertDoctor.isAvailable ?? true,
      userId: insertDoctor.userId ?? null,
      departmentId: insertDoctor.departmentId ?? null,
      roomNumber: insertDoctor.roomNumber ?? null,
      currentPatients: 0
    };
    this.doctors.set(id, doctor);
    return doctor;
  }

  async updateDoctorStatus(id: number, isAvailable: boolean): Promise<Doctor> {
    const doctor = this.doctors.get(id);
    if (!doctor) throw new Error("Doctor not found");
    const updated = { ...doctor, isAvailable };
    this.doctors.set(id, updated);
    return updated;
  }

  async getDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const id = this.getId('departments');
    const department: Department = { ...insertDepartment, id };
    this.departments.set(id, department);
    return department;
  }

  async getDiseaseDistribution(): Promise<{ name: string, value: number }[]> {
    const counts = new Map<string, number>();
    const patients = Array.from(this.patients.values());

    for (const patient of patients) {
      if (patient.diagnosis) {
        const currentCount = counts.get(patient.diagnosis) || 0;
        counts.set(patient.diagnosis, currentCount + 1);
      }
    }

    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }

  async createPrediction(insertPrediction: any): Promise<Prediction> {
    const id = this.getId('predictions');
    const prediction: Prediction = {
      ...insertPrediction,
      id,
      createdAt: new Date(),
      patientId: insertPrediction.patientId || null
    };
    this.predictions.set(id, prediction);
    return prediction;
  }
}


export const memStorage = new MemStorage();
export let storage: IStorage = memStorage;

export function setStorage(newStorage: IStorage) {
  storage = newStorage;
}

