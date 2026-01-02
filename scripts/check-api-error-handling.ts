/**
 * Check API Routes for Missing Error Handling
 * 
 * Scans all API routes to find:
 * - Missing try/catch blocks
 * - No error responses
 * - Missing timeout configurations
 */

import * as fs from 'fs';
import * as path from 'path';

interface RouteIssue {
  file: string;
  issue: string;
  line?: number;
}

const issues: RouteIssue[] = [];

function checkRoute(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Check for exported functions (GET, POST, etc.)
  const hasPOST = /export\s+async\s+function\s+POST/.test(content);
  const hasGET = /export\s+async\s+function\s+GET/.test(content);
  const hasPUT = /export\s+async\s+function\s+PUT/.test(content);
  const hasDELETE = /export\s+async\s+function\s+DELETE/.test(content);
  
  if (!hasPOST && !hasGET && !hasPUT && !hasDELETE) {
    return; // Not an API route
  }
  
  const shortPath = filePath.replace(process.cwd(), '');
  
  // Check for try/catch
  const hasTryCatch = /try\s*{/.test(content);
  if (!hasTryCatch) {
    issues.push({
      file: shortPath,
      issue: 'Missing try/catch block - unhandled errors will cause 500',
    });
  }
  
  // Check for error responses
  const hasErrorResponse = /status:\s*5\d\d/.test(content) || /NextResponse\.json.*500/.test(content);
  if (!hasErrorResponse && hasTryCatch) {
    issues.push({
      file: shortPath,
      issue: 'Has try/catch but no explicit 500 error response',
    });
  }
  
  // Check for database queries without timeout
  const hasPrisma = content.includes('prisma.');
  const hasTimeout = /maxDuration|timeout|AbortController/.test(content);
  
  if (hasPrisma && !hasTimeout && !filePath.includes('/cron/')) {
    issues.push({
      file: shortPath,
      issue: 'Database queries without timeout protection',
    });
  }
  
  // Check for external API calls without error handling
  const hasFetch = content.includes('fetch(');
  const hasAwait = content.includes('await fetch');
  
  if (hasFetch && hasAwait) {
    // Check if fetch has .catch() or is in try/catch
    const fetchLines = lines.filter(line => line.includes('await fetch'));
    fetchLines.forEach((line, idx) => {
      const hasLocalTry = lines.slice(Math.max(0, idx - 5), idx).some(l => l.includes('try'));
      const hasCatch = lines.slice(idx, Math.min(lines.length, idx + 10)).some(l => l.includes('.catch('));
      
      if (!hasLocalTry && !hasCatch) {
        issues.push({
          file: shortPath,
          issue: `Unhandled fetch() call - potential timeout/network error`,
          line: idx + 1,
        });
      }
    });
  }
}

function scanDirectory(dir: string): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.name === 'route.ts' || entry.name === 'route.tsx') {
      checkRoute(fullPath);
    }
  });
}

// Run check
console.log('🔍 Checking API routes for error handling issues...\n');

const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
scanDirectory(apiDir);

// Report
if (issues.length === 0) {
  console.log('✅ All API routes have proper error handling!');
} else {
  console.log(`⚠️  Found ${issues.length} potential issues:\n`);
  
  issues.forEach((issue, idx) => {
    console.log(`${idx + 1}. ${issue.file}`);
    console.log(`   ${issue.issue}`);
    if (issue.line) console.log(`   Line: ${issue.line}`);
    console.log();
  });
  
  console.log('\n💡 Recommendations:');
  console.log('- Add try/catch blocks to all async route handlers');
  console.log('- Return proper 500 error responses with user-friendly messages');
  console.log('- Add timeouts to database queries and external API calls');
  console.log('- Use AbortController for fetch() requests');
}
