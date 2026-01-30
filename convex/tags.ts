import { query } from "./_generated/server";

export const getAllTags = query({
  args: {},
  handler: async (ctx) => {
    const tags = await ctx.db.query("tags").collect();
    return tags.map((tag) => tag.name).sort();
  },
});
