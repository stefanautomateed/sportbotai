/**
 * Regenerate screenshots for published reviews
 * 
 * Run: npx tsx scripts/regenerate-screenshots.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { captureWebsiteScreenshot } from '../src/lib/blog/screenshot-generator';

const prisma = new PrismaClient();

async function main() {
    // Get recently published reviews that need screenshot updates
    const slugs = [
        'doc-sports-review',
        'rebelbetting-review',
        'betburger-review',
        'polymarket-review',
        'metaculus-review',
        'fantasypros-review',
        'flashscore-review',
        'understat-review'
    ];

    console.log(`📸 Regenerating screenshots for ${slugs.length} reviews...\n`);

    for (const slug of slugs) {
        const post = await prisma.blogPost.findUnique({
            where: { slug }
        });

        if (!post) {
            console.log(`❌ Blog post not found: ${slug}`);
            continue;
        }

        // Get tool review linked to this blog post
        const toolReview = await prisma.toolReview.findFirst({
            where: { blogPostId: post.id }
        });

        if (!toolReview) {
            console.log(`❌ Tool review not found for: ${slug}`);
            continue;
        }

        console.log(`📸 ${post.title}`);
        console.log(`   URL: ${toolReview.toolUrl}`);

        try {
            const screenshot = await captureWebsiteScreenshot(toolReview.toolUrl, toolReview.toolName);
            if (screenshot) {
                await prisma.blogPost.update({
                    where: { id: post.id },
                    data: { featuredImage: screenshot.url }
                });
                console.log(`   ✅ Updated: ${screenshot}\n`);
            } else {
                console.log(`   ⏭️ No screenshot returned\n`);
            }
        } catch (err) {
            console.log(`   ❌ Error: ${err instanceof Error ? err.message : err}\n`);
        }
    }

    await prisma.$disconnect();
    console.log('Done!');
}

main().catch(console.error);
