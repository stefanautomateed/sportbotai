import { prisma } from '../src/lib/prisma';

async function main() {
  // Find all match previews EXCEPT the new OKC vs Bulls one
  const posts = await prisma.blogPost.findMany({
    where: {
      category: 'Match Previews',
      NOT: {
        slug: 'okc-thunder-vs-chicago-bulls-prediction-2025'
      }
    },
    select: { id: true, slug: true, title: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 50, // Page 1 posts
  });

  console.log(`Found ${posts.length} match previews to delete:\n`);
  for (const p of posts) {
    console.log(`- ${p.slug}`);
  }
  
  // Delete them
  const deleted = await prisma.blogPost.deleteMany({
    where: {
      category: 'Match Previews',
      NOT: {
        slug: 'okc-thunder-vs-chicago-bulls-prediction-2025'
      }
    }
  });
  
  console.log(`\n✅ Deleted ${deleted.count} match previews`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
