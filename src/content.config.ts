import { defineCollection, z } from 'astro:content';

const journal = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.string().optional(),
    draft: z.boolean().default(false),
    description: z.string().optional(),
    cover: z.string().optional(),
  }),
});

export const collections = { journal };
