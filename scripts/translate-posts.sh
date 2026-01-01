#!/bin/bash

# Load environment variables and run translation script
export $(cat .env.local | grep -v '^#' | xargs)
npx tsx scripts/translate-blog-posts.ts "$@"
