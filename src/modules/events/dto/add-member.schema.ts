import { z } from 'zod';

export const addEventMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['HEAD_JUDGE', 'JUDGE', 'PRIORITY_JUDGE', 'ATHLETE']),
});

export type AddEventMemberDto = z.infer<typeof addEventMemberSchema>;

export const updateEventMemberSchema = z.object({
  status: z.enum(['active', 'inactive']),
});

export type UpdateEventMemberDto = z.infer<typeof updateEventMemberSchema>;
