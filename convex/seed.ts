import { mutation } from "./_generated/server";

export const seedTags = mutation({
  args: {},
  handler: async (ctx) => {
    const defaultTags = [
      "JavaScript",
      "TypeScript",
      "React",
      "Vue",
      "Angular",
      "Node.js",
      "Python",
      "Java",
      "Go",
      "Rust",
      "C#",
      "PHP",
      "Ruby",
      "Swift",
      "Kotlin",
      "SQL",
      "NoSQL",
      "AWS",
      "Azure",
      "GCP",
      "Docker",
      "Kubernetes",
      "DevOps",
      "Full Stack",
      "Frontend",
      "Backend",
      "Mobile",
      "iOS",
      "Android",
      "Machine Learning",
      "AI",
    ];

    let created = 0;
    for (const name of defaultTags) {
      const existing = await ctx.db
        .query("tags")
        .withIndex("by_name", (q) => q.eq("name", name))
        .unique();

      if (!existing) {
        await ctx.db.insert("tags", { name });
        created++;
      }
    }

    return { created, total: defaultTags.length };
  },
});
