import { z } from 'zod';

export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(255).optional(),
});

export type UpdateOrganizationDto = z.infer<typeof updateOrganizationSchema>;
