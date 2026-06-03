import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const toolsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tools' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['文件处理', '系统优化', '效率工具', '网络工具', '其他']),
    version: z.string(),
    fileSize: z.string(),
    compatibility: z.string().default('Windows 10 / 11（64位）'),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    cover: z.string().optional(),
    coverEmoji: z.string().optional(),
    downloadLinks: z.array(z.object({
      name: z.string(),      // 如 "百度网盘"
      url: z.string(),
      extractCode: z.string().optional(),
    })),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  tools: toolsCollection,
};
