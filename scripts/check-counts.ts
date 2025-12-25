import { prisma } from '../src/lib/prisma';

async function check() {
  const blogs = await prisma.blogPost.count();
  const agents = await prisma.agentPost.count();
  console.log('BlogPost count:', blogs);
  console.log('AgentPost count:', agents, '(untouched)');
}

check().finally(() => prisma.$disconnect());
