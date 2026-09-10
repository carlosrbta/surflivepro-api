import z from 'zod';

export const healthStatusSchema = z.object({
  status: z.enum(['ok', 'error']),
  timestamp: z.string().datetime(),
});

export type HealthStatusInput = z.infer<typeof healthStatusSchema>;
