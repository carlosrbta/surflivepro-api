import { z } from 'zod';

export const addOrganizationMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['ORGANIZER', 'MEMBER']),
});

export type AddOrganizationMemberDto = z.infer<
  typeof addOrganizationMemberSchema
>;

export const updateOrganizationMemberSchema = z.object({
  role: z.enum(['ORGANIZER', 'MEMBER']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export type UpdateOrganizationMemberDto = z.infer<
  typeof updateOrganizationMemberSchema
>;
