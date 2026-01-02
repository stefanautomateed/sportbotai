#!/usr/bin/env node
/**
 * Semrush SEO Audit Checker
 * 
 * Comprehensive check for all Semrush health categories
 * Run: npm run seo-audit
 */

import * as fs from 'fs';
import * as path from 'path';

interface AuditResult {
  category: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

const results: AuditResult[] = [];

function pass(category: string, message: string) {
  results.push({ category, status: 'pass', message });
}

function fail(category: string, message: string, details?: string) {
  results.push({ category, status: 'fail', message, details });
}

function warn(category: string, message: string, details?: string) {
  results.push({ category, status: 'warning', message, details });
}

// Check robots.txt
function checkRobotsTxt() {
  const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
  if (!fs.existsSync(robotsPath)) {
    fail('Robots.txt', 'robots.txt not found');
    return;
  }
  
  const content = fs.readFileSync(robotsPath, 'utf-8');
  
  // Check sitemap declaration
  if (!content.includes('Sitemap:')) {
    fail('Robots.txt', 'Sitemap not declared in robots.txt');
  } else {
    pass('Robots.txt', 'Sitemap properly declared');
  }
  
  // Check for proper user-agent directives
  if (!content.includes('User-agent:')) {
    fail('Robots.txt', 'No User-agent directives found');
  } else {
    pass('Robots.txt', 'User-agent directives present');
  }
}

// Check sitemap
function checkSitemap() {
  const sitemapPath = path.join(process.cwd(), 'src', 'app', 'sitemap.ts');
  if (!fs.existsSync(sitemapPath)) {
    fail('Sitemap', 'sitemap.ts not found - dynamic sitemap missing');
    return;
  }
  
  const content = fs.readFileSync(sitemapPath, 'utf-8');
  
  if (content.includes('export default')) {
    pass('Sitemap', 'Dynamic sitemap.ts exists');
  } else {
    fail('Sitemap', 'sitemap.ts found but not exporting default function');
  }
  
  // Check if includes blog/news
  if (content.includes('blogPost') || content.includes('news')) {
    pass('Sitemap', 'Dynamic content (blog/news) included in sitemap');
  } else {
    warn('Sitemap', 'Sitemap may be missing dynamic content');
  }
}

// Check llms.txt
function checkLlmsTxt() {
  const llmsPath = path.join(process.cwd(), 'public', 'llms.txt');
  if (!fs.existsSync(llmsPath)) {
    warn('LLMs.txt', 'llms.txt not found - AI discoverability affected');
    return;
  }
  
  const content = fs.readFileSync(llmsPath, 'utf-8');
  
  // Check for proper markdown formatting
  if (!content.includes('#') || !content.includes('##')) {
    warn('LLMs.txt', 'llms.txt may have formatting issues (missing headers)');
  } else {
    pass('LLMs.txt', 'llms.txt properly formatted with headers');
  }
  
  // Check for essential sections
  if (!content.includes('About') && !content.includes('## About')) {
    warn('LLMs.txt', 'llms.txt missing "About" section');
  }
  
  if (!content.includes('http')) {
    warn('LLMs.txt', 'llms.txt missing URLs for AI crawlers');
  } else {
    pass('LLMs.txt', 'llms.txt includes proper URLs');
  }
}

// Check for compression configuration
function checkCompression() {
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  if (!fs.existsSync(nextConfigPath)) {
    fail('Compression', 'next.config.js not found');
    return;
  }
  
  const content = fs.readFileSync(nextConfigPath, 'utf-8');
  
  // Next.js/Vercel automatically compress - check if disabled
  if (content.includes('compress: false')) {
    fail('Compression', 'Compression explicitly disabled in next.config.js');
  } else {
    pass('Compression', 'Compression enabled (Next.js default)');
  }
  
  // Check for image optimization
  if (content.includes('images:')) {
    pass('Images', 'Image optimization configured');
  } else {
    warn('Images', 'No explicit image optimization config');
  }
}

// Check for HTTPS enforcement
function checkHTTPS() {
  const vercelPath = path.join(process.cwd(), 'vercel.json');
  if (fs.existsSync(vercelPath)) {
    const content = fs.readFileSync(vercelPath, 'utf-8');
    const config = JSON.parse(content);
    
    // Vercel automatically enforces HTTPS
    pass('HTTPS', 'Vercel automatically enforces HTTPS');
  } else {
    pass('HTTPS', 'Next.js on Vercel - HTTPS enforced by default');
  }
}

// Check for canonical tags
function checkCanonicalTags() {
  const metadataFiles = [
    'src/lib/seo.ts',
    'src/app/page.tsx',
    'src/app/blog/page.tsx',
  ];
  
  let hasCanonicals = false;
  
  metadataFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.includes('canonical')) {
        hasCanonicals = true;
      }
    }
  });
  
  if (hasCanonicals) {
    pass('Canonical Tags', 'Canonical tags configured in metadata');
  } else {
    warn('Canonical Tags', 'No canonical tags found in common files');
  }
}

// Check for hreflang
function checkHreflang() {
  const layoutFiles = [
    'src/app/layout.tsx',
    'src/app/sr/layout.tsx',
  ];
  
  let hasHreflang = false;
  
  layoutFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.includes('hreflang') || content.includes('languages:')) {
        hasHreflang = true;
      }
    }
  });
  
  if (hasHreflang) {
    pass('Hreflang', 'Hreflang attributes configured for i18n');
  } else {
    warn('Hreflang', 'No hreflang found - important for Serbian/English alternates');
  }
}

// Check performance config
function checkPerformance() {
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  const content = fs.readFileSync(nextConfigPath, 'utf-8');
  
  // Check for CSS optimization
  if (content.includes('optimizeCss')) {
    pass('Performance', 'CSS optimization enabled');
  }
  
  // Check for package optimization
  if (content.includes('optimizePackageImports')) {
    pass('Performance', 'Package imports optimized');
  }
}

// Check for security headers
function checkSecurityHeaders() {
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  const content = fs.readFileSync(nextConfigPath, 'utf-8');
  
  const securityHeaders = [
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Referrer-Policy',
  ];
  
  securityHeaders.forEach(header => {
    if (content.includes(header)) {
      pass('Security', `${header} configured`);
    } else {
      warn('Security', `${header} not configured`);
    }
  });
}

// Run all checks
console.log('🔍 Running Semrush SEO Audit Checks...\n');

checkRobotsTxt();
checkSitemap();
checkLlmsTxt();
checkCompression();
checkHTTPS();
checkCanonicalTags();
checkHreflang();
checkPerformance();
checkSecurityHeaders();

// Print results
console.log('\n📊 AUDIT RESULTS:\n');

const passes = results.filter(r => r.status === 'pass');
const warnings = results.filter(r => r.status === 'warning');
const failures = results.filter(r => r.status === 'fail');

if (passes.length > 0) {
  console.log(`✅ PASSING (${passes.length}):`);
  passes.forEach(r => console.log(`   ${r.category}: ${r.message}`));
  console.log();
}

if (warnings.length > 0) {
  console.log(`⚠️  WARNINGS (${warnings.length}):`);
  warnings.forEach(r => {
    console.log(`   ${r.category}: ${r.message}`);
    if (r.details) console.log(`      ${r.details}`);
  });
  console.log();
}

if (failures.length > 0) {
  console.log(`❌ FAILURES (${failures.length}):`);
  failures.forEach(r => {
    console.log(`   ${r.category}: ${r.message}`);
    if (r.details) console.log(`      ${r.details}`);
  });
  console.log();
}

// Summary
const score = Math.round((passes.length / results.length) * 100);
console.log(`\n🎯 SEO HEALTH SCORE: ${score}%`);
console.log(`   ${passes.length} passed, ${warnings.length} warnings, ${failures.length} failed\n`);

if (score >= 90) {
  console.log('🎉 Excellent! Your site is well-optimized for search engines.');
} else if (score >= 70) {
  console.log('✅ Good! Address warnings to improve further.');
} else {
  console.log('⚠️  Needs improvement. Focus on failures first.');
}

process.exit(failures.length > 0 ? 1 : 0);
