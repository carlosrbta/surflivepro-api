import { z } from 'zod';

export const updateEventSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  status: z
    .enum(['DRAFT', 'OPEN', 'IN_PROGRESS', 'FINISHED', 'CANCELLED'])
    .optional(),
});

export type UpdateEventDto = z.infer<typeof updateEventSchema>;
