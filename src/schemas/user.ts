import * as z from 'zod'

// TODO: Change this schema to use prisma username schema later
export const SearchUserSchema = z.object({
  username: z.string().min(1),
})
