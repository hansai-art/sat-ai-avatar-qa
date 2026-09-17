import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { questionSchema } from './lib/schema.mjs';

const questions = defineCollection({
  loader: glob({base:process.env.BUILD_MODE==='demo'?'./tests/fixtures/questions':'./src/content/questions',pattern:'**/*.md',generateId:({entry})=>entry.replace(/\.md$/,'')}),
  schema: questionSchema,
});
export const collections = {questions};
