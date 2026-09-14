import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async get(ctx: Context) {
    const data = await strapi.service('api::forum-summary.forum-summary').get();
    ctx.set('Cache-Control', 'public, max-age=60');
    ctx.body = { data };
  },
});
