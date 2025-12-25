/**
 * Delete first page of posts from BlogPost and AgentPost
 * First page = most recent 12 posts (typical page size)
 */

import { prisma } from '../src/lib/prisma';

async function deleteFirstPage() {
  console.log('🗑️ Deleting first page of posts...\n');

  // Get counts
  const blogCount = await prisma.blogPost.count();
  const agentCount = await prisma.agentPost.count();
  
  console.log(`📊 Current counts:`);
  console.log(`   - BlogPost: ${blogCount}`);
  console.log(`   - AgentPost: ${agentCount}`);
  console.log('');

  // Delete first 12 blog posts (most recent)
  const blogsToDelete = await prisma.blogPost.findMany({
    take: 12,
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, createdAt: true },
  });

  if (blogsToDelete.length > 0) {
    console.log(`📝 Deleting ${blogsToDelete.length} blog posts:`);
    for (const post of blogsToDelete) {
      console.log(`   - ${post.title.substring(0, 50)}...`);
    }
    
    const blogIds = blogsToDelete.map(p => p.id);
    const deletedBlogs = await prisma.blogPost.deleteMany({
      where: { id: { in: blogIds } },
    });
    console.log(`   ✅ Deleted ${deletedBlogs.count} blog posts\n`);
  } else {
    console.log('📝 No blog posts to delete\n');
  }

  // Delete first 12 agent posts (most recent)
  const agentToDelete = await prisma.agentPost.findMany({
    take: 12,
    orderBy: { createdAt: 'desc' },
    select: { id: true, homeTeam: true, awayTeam: true, createdAt: true },
  });

  if (agentToDelete.length > 0) {
    console.log(`🤖 Deleting ${agentToDelete.length} agent posts:`);
    for (const post of agentToDelete) {
      console.log(`   - ${post.homeTeam} vs ${post.awayTeam}`);
    }
    
    const agentIds = agentToDelete.map(p => p.id);
    const deletedAgents = await prisma.agentPost.deleteMany({
      where: { id: { in: agentIds } },
    });
    console.log(`   ✅ Deleted ${deletedAgents.count} agent posts\n`);
  } else {
    console.log('🤖 No agent posts to delete\n');
  }

  // Final counts
  const newBlogCount = await prisma.blogPost.count();
  const newAgentCount = await prisma.agentPost.count();
  
  console.log(`📊 New counts:`);
  console.log(`   - BlogPost: ${newBlogCount} (was ${blogCount})`);
  console.log(`   - AgentPost: ${newAgentCount} (was ${agentCount})`);
  console.log('\n✅ Done!');
}

deleteFirstPage()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
