// Script to regenerate SVG blog images with AI
// ONLY fixes guide-style blogs, NOT match previews

require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    // Dynamic import after env is loaded
    const { generateFeaturedImage } = await import('../src/lib/blog/image-generator');

    // Find ONLY GUIDE blogs with SVG images (NOT match previews)
    const svgBlogs = await prisma.blogPost.findMany({
        where: {
            featuredImage: { contains: '.svg' },
            // Exclude match previews - they have team images already
            NOT: {
                OR: [
                    { category: 'Match Previews' },
                    { postType: 'MATCH_PREVIEW' },
                    { postType: 'MATCH_COMBINED' },
                    { title: { contains: ' vs ' } },
                    { title: { contains: ' prediction ' } }
                ]
            }
        },
        select: {
            id: true,
            title: true,
            category: true,
            focusKeyword: true,
            slug: true,
            postType: true
        },
        orderBy: { createdAt: 'desc' },
        take: 20
    });

    console.log(`\n🎨 Regenerating ${svgBlogs.length} GUIDE blogs with AI images...`);
    console.log('(Skipping match previews - they already have team images)\n');

    let success = 0;
    let failed = 0;

    for (const blog of svgBlogs) {
        console.log(`📝 ${blog.title?.substring(0, 55)}...`);
        console.log(`   Category: ${blog.category}`);

        try {
            const result = await generateFeaturedImage(
                blog.title || blog.slug,
                blog.focusKeyword || blog.slug,
                blog.category || 'Educational Guides'
            );

            await prisma.blogPost.update({
                where: { id: blog.id },
                data: { featuredImage: result.url }
            });

            console.log(`   ✅ ${result.url.substring(0, 70)}...`);
            success++;
        } catch (error) {
            console.error(`   ❌ Error:`, error);
            failed++;
        }

        // Delay to avoid rate limits
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log(`\n=========================`);
    console.log(`✅ Success: ${success}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`=========================\n`);

    await prisma.$disconnect();
}

main().catch(console.error);
