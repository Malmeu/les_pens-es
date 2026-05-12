import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const thoughts = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/thoughts" }),
	schema: z.object({
		title: z.string(),
		date: z.string().or(z.date()),
		type: z.enum(['positive', 'negative', 'poem']),
		description: z.string().optional(),
	}),
});

export const collections = { thoughts };
