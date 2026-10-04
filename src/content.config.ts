import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const testimonials = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/testimonials' }),
    schema: z.object({
        name: z.string(),
        rating: z.number().int().min(1).max(5).default(5),
    }),
});

export const collections = { testimonials };
