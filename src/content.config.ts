import { defineCollection } from "astro:content";
import { glob, file } from "astro/loaders";
import { z } from "astro/zod";

const socialSchema = z
  .object({
    twitter: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    github: z.string().url().optional(),
    bluesky: z.string().url().optional(),
    website: z.string().url().optional(),
  })
  .optional();

const speakers = defineCollection({
  loader: glob({ base: "./src/content/speakers", pattern: "**/*.md" }),
  schema: z.object({
    name: z.string(),
    company: z.string().optional(),
    role: z.string().optional(),
    photo: z.string().optional(),
    bio: z.string(),
    social: socialSchema,
  }),
});

const talks = defineCollection({
  loader: glob({ base: "./src/content/talks", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    speaker: z.string(),
    cospeakers: z.array(z.string()).optional(),
    track: z.enum(["cloud-infra", "devops-platform", "security", "community"]),
    format: z.enum(["talk", "lightning", "workshop", "keynote"]),
    duration: z.number(),
    room: z.string().optional(),
    startTime: z.string().optional(),
    tags: z.array(z.string()).optional(),
    youtubeUrl: z.string().url().optional(),
    feedbackUrl: z.string().url().optional(),
  }),
});

const sponsors = defineCollection({
  loader: file("src/content/sponsors/sponsors.yaml"),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    tier: z.enum(["platinum", "gold", "silver", "community"]),
    logo: z.string(),
    url: z.string().url(),
    description: z.object({
      fr: z.string(),
      en: z.string(),
    }),
  }),
});

const team = defineCollection({
  loader: file("src/content/team/team.yaml"),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    role: z.object({
      fr: z.string(),
      en: z.string(),
    }),
    group: z.enum(["core", "program-committee", "volunteers"]),
    photo: z.string().optional(),
    social: z
      .object({
        twitter: z.string().url().optional(),
        linkedin: z.string().url().optional(),
        github: z.string().url().optional(),
        bluesky: z.string().url().optional(),
      })
      .optional(),
  }),
});

export const collections = { speakers, talks, sponsors, team };
