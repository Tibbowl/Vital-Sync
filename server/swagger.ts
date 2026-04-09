import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Vital Sync AI API',
            version: '1.0.0',
            description: 'API documentation for the Vital Sync AI Hospital Management System',
            contact: {
                name: 'System Admin',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development server',
            },
        ],
        components: {
            schemas: {
                Patient: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        age: { type: 'integer' },
                        gender: { type: 'string' },
                        symptoms: { type: 'string' },
                        status: { type: 'string', enum: ['transporting', 'in-treatment', 'discharged', 'admitted'] },
                        urgency: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                        diagnosis: { type: 'string' },
                        assignedDoctorId: { type: 'integer' },
                        departmentId: { type: 'integer' }
                    },
                },
                Doctor: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        specialty: { type: 'string' },
                        departmentId: { type: 'integer' },
                        isAvailable: { type: 'boolean' },
                        roomNumber: { type: 'string' }
                    }
                }
            }
        },
        paths: {
            '/api/patients': {
                get: {
                    summary: 'Get all patients',
                    tags: ['Patients'],
                    responses: {
                        200: {
                            description: 'List of all patients',
                            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Patient' } } } }
                        }
                    }
                },
                post: {
                    summary: 'Create a new patient',
                    tags: ['Patients'],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['name', 'age', 'symptoms'],
                                    properties: {
                                        name: { type: 'string' },
                                        age: { type: 'integer' },
                                        gender: { type: 'string' },
                                        symptoms: { type: 'string' },
                                        vitals: { type: 'object' }
                                    }
                                }
                            }
                        },
                        responses: {
                            201: { description: 'Patient created successfully' }
                        }
                    }
                },
            },
            '/api/patients/{id}': {
                patch: {
                    summary: 'Update patient status',
                    tags: ['Patients'],
                    parameters: [
                        { in: 'path', name: 'id', required: true, schema: { type: 'integer' } }
                    ],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: { status: { type: 'string' } }
                                }
                            }
                        }
                    },
                    responses: { 200: { description: 'Updated' } }
                },
                delete: {
                    summary: 'Discharge/Delete patient',
                    tags: ['Patients'],
                    parameters: [
                        { in: 'path', name: 'id', required: true, schema: { type: 'integer' } }
                    ],
                    responses: { 200: { description: 'Patient discharged' } }
                },
            },
            '/api/doctors': {
                get: {
                    summary: 'Get all doctors',
                    tags: ['Doctors'],
                    responses: {
                        200: {
                            description: 'List of doctors',
                            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Doctor' } } } }
                        }
                    }
                }
            },
            '/api/ai/assign': {
                post: {
                    summary: 'Auto-assign doctor to patient',
                    tags: ['AI'],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['patientId'],
                                    properties: { patientId: { type: 'integer' } }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Assignment successful',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            doctorId: { type: 'integer' },
                                            predictedDisease: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/ai/predict': {
                post: {
                    summary: 'Predict disease from symptoms',
                    tags: ['AI'],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['symptoms'],
                                    properties: {
                                        symptoms: { type: 'string' },
                                        age: { type: 'integer' },
                                        gender: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Prediction result' }
                    }
                }
            }
        }
    },
    apis: ['./server/routes.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
