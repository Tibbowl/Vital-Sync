import { z } from 'zod';
import { insertPatientSchema, insertDoctorSchema, insertDepartmentSchema, patients, doctors, departments } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({
        username: z.string(),
        password: z.string(),
        role: z.enum(['admin', 'doctor', 'ambulance']),
      }),
      responses: {
        200: z.object({
          id: z.number(),
          username: z.string(),
          role: z.string(),
          name: z.string(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
  },
  patients: {
    list: {
      method: 'GET' as const,
      path: '/api/patients',
      responses: {
        200: z.array(z.custom<typeof patients.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/patients/:id',
      responses: {
        200: z.custom<typeof patients.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/patients',
      input: insertPatientSchema,
      responses: {
        201: z.custom<typeof patients.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/patients/:id',
      input: insertPatientSchema.partial(),
      responses: {
        200: z.custom<typeof patients.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },
  doctors: {
    list: {
      method: 'GET' as const,
      path: '/api/doctors',
      responses: {
        200: z.array(z.custom<typeof doctors.$inferSelect & { department?: { name: string } }>()),
      },
    },
  },
  departments: {
    list: {
      method: 'GET' as const,
      path: '/api/departments',
      responses: {
        200: z.array(z.custom<typeof departments.$inferSelect>()),
      },
    },
  },
  stats: {
    distribution: {
      method: 'GET' as const,
      path: '/api/stats/distribution',
      responses: {
        200: z.array(z.object({
          name: z.string(),
          value: z.number(),
          fill: z.string(),
        })),
      },
    },
  },
  ai: {
    predict: {
      method: 'POST' as const,
      path: '/api/ai/predict',
      input: z.object({
        symptoms: z.string(),
        age: z.number().optional(),
        gender: z.string().optional(),
      }),
      responses: {
        200: z.object({
          predictedDisease: z.string(),
          confidence: z.number(),
          recommendedDepartment: z.string(),
          riskFactor: z.boolean(),
          urgency: z.string().optional(),
          analysis: z.string(),
        }),
      },
    },
    autoAssign: {
      method: 'POST' as const,
      path: '/api/ai/assign',
      input: z.object({
        patientId: z.number(),
      }),
      responses: {
        200: z.object({
          doctorId: z.number(),
          doctorName: z.string(),
          roomNumber: z.string(),
          predictedDisease: z.string(),
          message: z.string(),
        }),
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
