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

const books = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/books" }),
	schema: z.object({
		title: z.string(), // chapter/page title
		bookId: z.string(), // identifier of the book (slug)
		bookTitle: z.string(), // general title of the book
		bookDescription: z.string().optional(), // general description of the book
		coverColor: z.enum(['pink', 'purple', 'blue', 'green', 'cream']), // theme cover color
		chapterNumber: z.number(), // order of chapter/page
		date: z.string().or(z.date()),
		description: z.string().optional(),
	}),
});

export const collections = { thoughts, books };
