import { z } from 'zod';

export const pageSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
  })
  .loose();

export const docsPageSchema = pageSchema.extend({
  date: z.preprocess((arg) => {
    if (arg instanceof Date) {
      const year = arg.getFullYear();
      const month = String(arg.getMonth() + 1).padStart(2, '0');
      const day = String(arg.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    if (typeof arg === 'string') {
      return arg.trim();
    }

    return arg;
  }, z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  author: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

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
