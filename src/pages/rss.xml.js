import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const tools = await getCollection('tools', ({ data }) => !data.draft);
  tools.sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());

  return rss({
    title: 'WinTools — 原创 Windows 小工具',
    description: '原创 Windows 实用小工具，免费分享，附图文教程，开箱即用。',
    site: context.site,
    items: tools.map(tool => ({
      title: tool.data.title,
      description: tool.data.description,
      pubDate: tool.data.publishDate,
      link: `/tools/${tool.id}/`,
    })),
    customData: '<language>zh-cn</language>',
  });
}
