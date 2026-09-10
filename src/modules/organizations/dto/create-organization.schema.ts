import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(255),
});

export type CreateOrganizationDto = z.infer<typeof createOrganizationSchema>;
