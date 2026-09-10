import { z } from 'zod';

export const createEventSchema = z.object({
  name: z.string().min(2).max(255),
});

export type CreateEventDto = z.infer<typeof createEventSchema>;
