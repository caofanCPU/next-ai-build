import { z } from 'zod';

export const pageSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
  })
  .loose();

export const metaSchema = z
  .object({
    title: z.string().optional(),
    pages: z.array(z.string()).optional(),
    description: z.string().optional(),
    root: z.boolean().optional(),
    defaultOpen: z.boolean().optional(),
    icon: z.string().optional(),
  })
  .loose();
