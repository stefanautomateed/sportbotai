-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO', 'PREMIUM', 'ADMIN');

-- CreateEnum
CREATE TYPE "KeywordStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXHAUSTED', 'DISABLED');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('GENERAL', 'MATCH_PREVIEW', 'MATCH_RECAP', 'MATCH_COMBINED', 'NEWS');

-- CreateEnum
CREATE TYPE "CallType" AS ENUM ('MATCH_RESULT', 'OVER_UNDER', 'BTTS', 'PLAYER_PROP', 'FIRST_SCORER', 'CLEAN_SHEET', 'CORNER_COUNT', 'CARD_COUNT', 'HANDICAP', 'DOUBLE_CHANCE');

-- CreateEnum
CREATE TYPE "CallOutcome" AS ENUM ('PENDING', 'HIT', 'MISS', 'PUSH', 'VOID');

-- CreateEnum
CREATE TYPE "PredictionSource" AS ENUM ('PRE_ANALYZE', 'MATCH_ANALYSIS', 'AGENT_POST');

-- CreateEnum
CREATE TYPE "PostCategory" AS ENUM ('MORNING_BRIEFING', 'MATCH_PREVIEW', 'LIVE_UPDATE', 'POST_MATCH', 'CALL_VALIDATION', 'HOT_TAKE', 'TRENDING', 'WEEKLY_STATS', 'THREAD', 'LIVE_INTEL');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "stripeCurrentPeriodEnd" TIMESTAMP(3),
    "analysisCount" INTEGER NOT NULL DEFAULT 0,
    "lastAnalysisDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "referralCampaign" TEXT,
    "referralMedium" TEXT,
    "referralSource" TEXT,
    "bannedReason" TEXT,
    "bonusCredits" INTEGER NOT NULL DEFAULT 0,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "lastActiveAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "league" TEXT NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "matchDate" TIMESTAMP(3),
    "userPick" TEXT,
    "userStake" DOUBLE PRECISION,
    "homeWinProb" DOUBLE PRECISION,
    "drawProb" DOUBLE PRECISION,
    "awayWinProb" DOUBLE PRECISION,
    "riskLevel" TEXT,
    "bestValueSide" TEXT,
    "fullResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogKeyword" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "status" "KeywordStatus" NOT NULL DEFAULT 'PENDING',
    "lastGeneratedAt" TIMESTAMP(3),
    "generationCount" INTEGER NOT NULL DEFAULT 0,
    "searchVolume" INTEGER,
    "difficulty" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "focusKeyword" TEXT,
    "featuredImage" TEXT,
    "imageAlt" TEXT,
    "category" TEXT,
    "tags" TEXT[],
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "keywordId" TEXT,
    "aiModel" TEXT,
    "generationCost" DOUBLE PRECISION,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "awayTeam" TEXT,
    "finalScore" TEXT,
    "homeTeam" TEXT,
    "league" TEXT,
    "matchDate" TIMESTAMP(3),
    "matchId" TEXT,
    "postMatchContent" TEXT,
    "postMatchUpdatedAt" TIMESTAMP(3),
    "postType" "PostType" NOT NULL DEFAULT 'GENERAL',
    "sport" TEXT,
    "newsContent" TEXT,
    "newsTitle" TEXT,
    "slugSr" TEXT,
    "titleSr" TEXT,
    "excerptSr" TEXT,
    "contentSr" TEXT,
    "metaTitleSr" TEXT,
    "metaDescriptionSr" TEXT,
    "newsTitleSr" TEXT,
    "newsContentSr" TEXT,
    "translatedAt" TIMESTAMP(3),

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteTeam" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "teamSlug" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "league" TEXT,
    "sportKey" TEXT,
    "teamLogo" TEXT,
    "country" TEXT,
    "notifyMatches" BOOLEAN NOT NULL DEFAULT true,
    "notifyInjuries" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatQuery" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "queryNormalized" TEXT,
    "category" TEXT,
    "brainMode" TEXT,
    "sport" TEXT,
    "team" TEXT,
    "league" TEXT,
    "usedRealTimeSearch" BOOLEAN NOT NULL DEFAULT false,
    "responseLength" INTEGER,
    "hadCitations" BOOLEAN NOT NULL DEFAULT false,
    "queryHash" TEXT,
    "similarCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answer" TEXT,
    "citations" JSONB,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ChatQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendingTopic" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "category" TEXT,
    "sport" TEXT,
    "queryCount" INTEGER NOT NULL DEFAULT 1,
    "last24hCount" INTEGER NOT NULL DEFAULT 0,
    "last7dCount" INTEGER NOT NULL DEFAULT 0,
    "isSpike" BOOLEAN NOT NULL DEFAULT false,
    "spikeDetectedAt" TIMESTAMP(3),
    "lastFetchedAt" TIMESTAMP(3),
    "cachedResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrendingTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatFeedback" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "queryHash" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT,
    "sport" TEXT,
    "category" TEXT,
    "brainMode" TEXT,
    "usedRealTimeSearch" BOOLEAN NOT NULL DEFAULT false,
    "fromCache" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "userPlan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentPost" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "homeTeam" TEXT,
    "awayTeam" TEXT,
    "matchRef" TEXT,
    "league" TEXT,
    "sport" TEXT,
    "narrativeAngle" TEXT,
    "publicMismatch" TEXT,
    "clarityLevel" INTEGER,
    "confidence" INTEGER,
    "severity" INTEGER,
    "realTimeData" BOOLEAN NOT NULL DEFAULT false,
    "citations" TEXT[],
    "postedToX" BOOLEAN NOT NULL DEFAULT false,
    "xPostId" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "engagement" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "predictionId" TEXT,

    CONSTRAINT "AgentPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBase" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sport" TEXT,
    "category" TEXT,
    "team" TEXT,
    "quality" INTEGER NOT NULL DEFAULT 3,
    "useCount" INTEGER NOT NULL DEFAULT 1,
    "citations" TEXT[],
    "hadRealTimeData" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeBase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SportExpertise" (
    "id" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "topCategories" TEXT[],
    "commonQuestions" TEXT[],
    "keyTerminology" TEXT[],
    "learnedFacts" TEXT[],
    "totalQueries" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SportExpertise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "matchName" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "league" TEXT NOT NULL,
    "kickoff" TIMESTAMP(3) NOT NULL,
    "type" "CallType" NOT NULL,
    "prediction" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "conviction" INTEGER NOT NULL,
    "odds" DOUBLE PRECISION,
    "impliedProb" DOUBLE PRECISION,
    "tweetId" TEXT,
    "validationTweetId" TEXT,
    "outcome" "CallOutcome" NOT NULL DEFAULT 'PENDING',
    "actualResult" TEXT,
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "actualScore" TEXT,
    "source" "PredictionSource" NOT NULL DEFAULT 'PRE_ANALYZE',
    "closingOdds" DOUBLE PRECISION,
    "clvFetched" BOOLEAN NOT NULL DEFAULT false,
    "clvPercentage" DOUBLE PRECISION,
    "openingOdds" DOUBLE PRECISION,
    "valueBetEdge" DOUBLE PRECISION,
    "valueBetOdds" DOUBLE PRECISION,
    "valueBetOutcome" "CallOutcome",
    "valueBetProfit" DOUBLE PRECISION,
    "valueBetSide" TEXT,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledPost" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" "PostCategory" NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "matchId" TEXT,
    "predictionId" TEXT,
    "posted" BOOLEAN NOT NULL DEFAULT false,
    "postedAt" TIMESTAMP(3),
    "tweetId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwitterPost" (
    "id" TEXT NOT NULL,
    "tweetId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" "PostCategory" NOT NULL,
    "threadId" TEXT,
    "threadPosition" INTEGER,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "retweets" INTEGER NOT NULL DEFAULT 0,
    "replies" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TwitterPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyStats" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalPredictions" INTEGER NOT NULL DEFAULT 0,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "misses" INTEGER NOT NULL DEFAULT 0,
    "pushes" INTEGER NOT NULL DEFAULT 0,
    "hitRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conv1Hits" INTEGER NOT NULL DEFAULT 0,
    "conv1Total" INTEGER NOT NULL DEFAULT 0,
    "conv2Hits" INTEGER NOT NULL DEFAULT 0,
    "conv2Total" INTEGER NOT NULL DEFAULT 0,
    "conv3Hits" INTEGER NOT NULL DEFAULT 0,
    "conv3Total" INTEGER NOT NULL DEFAULT 0,
    "conv4Hits" INTEGER NOT NULL DEFAULT 0,
    "conv4Total" INTEGER NOT NULL DEFAULT 0,
    "conv5Hits" INTEGER NOT NULL DEFAULT 0,
    "conv5Total" INTEGER NOT NULL DEFAULT 0,
    "postsCount" INTEGER NOT NULL DEFAULT 0,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "totalRetweets" INTEGER NOT NULL DEFAULT 0,
    "totalImpressions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OddsSnapshot" (
    "id" TEXT NOT NULL,
    "matchRef" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "league" TEXT NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "matchDate" TIMESTAMP(3) NOT NULL,
    "homeOdds" DOUBLE PRECISION NOT NULL,
    "awayOdds" DOUBLE PRECISION NOT NULL,
    "drawOdds" DOUBLE PRECISION,
    "prevHomeOdds" DOUBLE PRECISION,
    "prevAwayOdds" DOUBLE PRECISION,
    "prevDrawOdds" DOUBLE PRECISION,
    "homeChange" DOUBLE PRECISION,
    "awayChange" DOUBLE PRECISION,
    "drawChange" DOUBLE PRECISION,
    "modelHomeProb" DOUBLE PRECISION,
    "modelAwayProb" DOUBLE PRECISION,
    "modelDrawProb" DOUBLE PRECISION,
    "homeEdge" DOUBLE PRECISION,
    "awayEdge" DOUBLE PRECISION,
    "drawEdge" DOUBLE PRECISION,
    "hasSteamMove" BOOLEAN NOT NULL DEFAULT false,
    "hasValueEdge" BOOLEAN NOT NULL DEFAULT false,
    "alertLevel" TEXT,
    "alertNote" TEXT,
    "bookmaker" TEXT DEFAULT 'consensus',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "openingAwayOdds" DOUBLE PRECISION,
    "openingDrawOdds" DOUBLE PRECISION,
    "openingHomeOdds" DOUBLE PRECISION,

    CONSTRAINT "OddsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareLink" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "league" TEXT NOT NULL DEFAULT 'Match',
    "verdict" TEXT NOT NULL DEFAULT 'AI Analysis',
    "risk" TEXT NOT NULL DEFAULT 'MEDIUM',
    "confidence" INTEGER NOT NULL DEFAULT 75,
    "value" TEXT,
    "matchDate" TEXT,
    "sport" TEXT NOT NULL DEFAULT 'soccer',
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EdgeTracking" (
    "id" TEXT NOT NULL,
    "predictionId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "league" TEXT NOT NULL,
    "kickoff" TIMESTAMP(3) NOT NULL,
    "ourModelHome" DOUBLE PRECISION NOT NULL,
    "ourModelAway" DOUBLE PRECISION NOT NULL,
    "ourModelDraw" DOUBLE PRECISION,
    "marketHome" DOUBLE PRECISION NOT NULL,
    "marketAway" DOUBLE PRECISION NOT NULL,
    "marketDraw" DOUBLE PRECISION,
    "ensembleMethod" TEXT NOT NULL DEFAULT 'default',
    "finalHome" DOUBLE PRECISION NOT NULL,
    "finalAway" DOUBLE PRECISION NOT NULL,
    "finalDraw" DOUBLE PRECISION,
    "edgeSide" TEXT NOT NULL,
    "edgeValue" DOUBLE PRECISION NOT NULL,
    "conviction" INTEGER NOT NULL,
    "situationalAdj" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trapGameFlag" BOOLEAN NOT NULL DEFAULT false,
    "outcome" "CallOutcome" NOT NULL DEFAULT 'PENDING',
    "actualResult" TEXT,
    "clvPercentage" DOUBLE PRECISION,
    "beatingMarket" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EdgeTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineMovement" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "matchName" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "league" TEXT NOT NULL,
    "kickoff" TIMESTAMP(3) NOT NULL,
    "openingHome" DOUBLE PRECISION NOT NULL,
    "openingAway" DOUBLE PRECISION NOT NULL,
    "openingDraw" DOUBLE PRECISION,
    "openingTime" TIMESTAMP(3) NOT NULL,
    "currentHome" DOUBLE PRECISION NOT NULL,
    "currentAway" DOUBLE PRECISION NOT NULL,
    "currentDraw" DOUBLE PRECISION,
    "updatedTime" TIMESTAMP(3) NOT NULL,
    "homeMovement" DOUBLE PRECISION NOT NULL,
    "awayMovement" DOUBLE PRECISION NOT NULL,
    "drawMovement" DOUBLE PRECISION,
    "isSharpMove" BOOLEAN NOT NULL DEFAULT false,
    "sharpSide" TEXT,
    "alertSent" BOOLEAN NOT NULL DEFAULT false,
    "alertSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LineMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Analysis_userId_idx" ON "Analysis"("userId");

-- CreateIndex
CREATE INDEX "Analysis_createdAt_idx" ON "Analysis"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BlogKeyword_keyword_key" ON "BlogKeyword"("keyword");

-- CreateIndex
CREATE INDEX "BlogKeyword_status_idx" ON "BlogKeyword"("status");

-- CreateIndex
CREATE INDEX "BlogKeyword_lastGeneratedAt_idx" ON "BlogKeyword"("lastGeneratedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_slug_idx" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_status_idx" ON "BlogPost"("status");

-- CreateIndex
CREATE INDEX "BlogPost_publishedAt_idx" ON "BlogPost"("publishedAt");

-- CreateIndex
CREATE INDEX "BlogPost_keywordId_idx" ON "BlogPost"("keywordId");

-- CreateIndex
CREATE INDEX "BlogPost_matchId_idx" ON "BlogPost"("matchId");

-- CreateIndex
CREATE INDEX "BlogPost_matchDate_idx" ON "BlogPost"("matchDate");

-- CreateIndex
CREATE INDEX "BlogPost_postType_idx" ON "BlogPost"("postType");

-- CreateIndex
CREATE INDEX "BlogPost_translatedAt_idx" ON "BlogPost"("translatedAt");

-- CreateIndex
CREATE INDEX "FavoriteTeam_userId_idx" ON "FavoriteTeam"("userId");

-- CreateIndex
CREATE INDEX "FavoriteTeam_teamSlug_idx" ON "FavoriteTeam"("teamSlug");

-- CreateIndex
CREATE INDEX "FavoriteTeam_sport_idx" ON "FavoriteTeam"("sport");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteTeam_userId_teamSlug_sport_key" ON "FavoriteTeam"("userId", "teamSlug", "sport");

-- CreateIndex
CREATE INDEX "ChatQuery_category_idx" ON "ChatQuery"("category");

-- CreateIndex
CREATE INDEX "ChatQuery_sport_idx" ON "ChatQuery"("sport");

-- CreateIndex
CREATE INDEX "ChatQuery_team_idx" ON "ChatQuery"("team");

-- CreateIndex
CREATE INDEX "ChatQuery_queryHash_idx" ON "ChatQuery"("queryHash");

-- CreateIndex
CREATE INDEX "ChatQuery_createdAt_idx" ON "ChatQuery"("createdAt");

-- CreateIndex
CREATE INDEX "ChatQuery_expiresAt_idx" ON "ChatQuery"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrendingTopic_topic_key" ON "TrendingTopic"("topic");

-- CreateIndex
CREATE INDEX "TrendingTopic_queryCount_idx" ON "TrendingTopic"("queryCount");

-- CreateIndex
CREATE INDEX "TrendingTopic_last24hCount_idx" ON "TrendingTopic"("last24hCount");

-- CreateIndex
CREATE INDEX "TrendingTopic_sport_idx" ON "TrendingTopic"("sport");

-- CreateIndex
CREATE INDEX "TrendingTopic_isSpike_idx" ON "TrendingTopic"("isSpike");

-- CreateIndex
CREATE INDEX "ChatFeedback_messageId_idx" ON "ChatFeedback"("messageId");

-- CreateIndex
CREATE INDEX "ChatFeedback_queryHash_idx" ON "ChatFeedback"("queryHash");

-- CreateIndex
CREATE INDEX "ChatFeedback_rating_idx" ON "ChatFeedback"("rating");

-- CreateIndex
CREATE INDEX "ChatFeedback_userId_idx" ON "ChatFeedback"("userId");

-- CreateIndex
CREATE INDEX "ChatFeedback_createdAt_idx" ON "ChatFeedback"("createdAt");

-- CreateIndex
CREATE INDEX "AgentPost_category_idx" ON "AgentPost"("category");

-- CreateIndex
CREATE INDEX "AgentPost_homeTeam_idx" ON "AgentPost"("homeTeam");

-- CreateIndex
CREATE INDEX "AgentPost_awayTeam_idx" ON "AgentPost"("awayTeam");

-- CreateIndex
CREATE INDEX "AgentPost_createdAt_idx" ON "AgentPost"("createdAt");

-- CreateIndex
CREATE INDEX "AgentPost_postedToX_idx" ON "AgentPost"("postedToX");

-- CreateIndex
CREATE INDEX "AgentPost_predictionId_idx" ON "AgentPost"("predictionId");

-- CreateIndex
CREATE INDEX "KnowledgeBase_sport_idx" ON "KnowledgeBase"("sport");

-- CreateIndex
CREATE INDEX "KnowledgeBase_category_idx" ON "KnowledgeBase"("category");

-- CreateIndex
CREATE INDEX "KnowledgeBase_team_idx" ON "KnowledgeBase"("team");

-- CreateIndex
CREATE INDEX "KnowledgeBase_quality_idx" ON "KnowledgeBase"("quality");

-- CreateIndex
CREATE INDEX "KnowledgeBase_useCount_idx" ON "KnowledgeBase"("useCount");

-- CreateIndex
CREATE UNIQUE INDEX "SportExpertise_sport_key" ON "SportExpertise"("sport");

-- CreateIndex
CREATE INDEX "SportExpertise_sport_idx" ON "SportExpertise"("sport");

-- CreateIndex
CREATE INDEX "Prediction_matchId_idx" ON "Prediction"("matchId");

-- CreateIndex
CREATE INDEX "Prediction_outcome_idx" ON "Prediction"("outcome");

-- CreateIndex
CREATE INDEX "Prediction_sport_idx" ON "Prediction"("sport");

-- CreateIndex
CREATE INDEX "Prediction_source_idx" ON "Prediction"("source");

-- CreateIndex
CREATE INDEX "Prediction_createdAt_idx" ON "Prediction"("createdAt");

-- CreateIndex
CREATE INDEX "Prediction_conviction_idx" ON "Prediction"("conviction");

-- CreateIndex
CREATE INDEX "Prediction_clvFetched_idx" ON "Prediction"("clvFetched");

-- CreateIndex
CREATE INDEX "Prediction_valueBetOutcome_idx" ON "Prediction"("valueBetOutcome");

-- CreateIndex
CREATE INDEX "ScheduledPost_scheduledFor_idx" ON "ScheduledPost"("scheduledFor");

-- CreateIndex
CREATE INDEX "ScheduledPost_posted_idx" ON "ScheduledPost"("posted");

-- CreateIndex
CREATE INDEX "ScheduledPost_contentType_idx" ON "ScheduledPost"("contentType");

-- CreateIndex
CREATE UNIQUE INDEX "TwitterPost_tweetId_key" ON "TwitterPost"("tweetId");

-- CreateIndex
CREATE INDEX "TwitterPost_category_idx" ON "TwitterPost"("category");

-- CreateIndex
CREATE INDEX "TwitterPost_postedAt_idx" ON "TwitterPost"("postedAt");

-- CreateIndex
CREATE INDEX "TwitterPost_threadId_idx" ON "TwitterPost"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStats_date_key" ON "DailyStats"("date");

-- CreateIndex
CREATE INDEX "DailyStats_date_idx" ON "DailyStats"("date");

-- CreateIndex
CREATE INDEX "OddsSnapshot_sport_idx" ON "OddsSnapshot"("sport");

-- CreateIndex
CREATE INDEX "OddsSnapshot_matchDate_idx" ON "OddsSnapshot"("matchDate");

-- CreateIndex
CREATE INDEX "OddsSnapshot_hasSteamMove_idx" ON "OddsSnapshot"("hasSteamMove");

-- CreateIndex
CREATE INDEX "OddsSnapshot_hasValueEdge_idx" ON "OddsSnapshot"("hasValueEdge");

-- CreateIndex
CREATE INDEX "OddsSnapshot_matchRef_idx" ON "OddsSnapshot"("matchRef");

-- CreateIndex
CREATE UNIQUE INDEX "OddsSnapshot_matchRef_sport_bookmaker_key" ON "OddsSnapshot"("matchRef", "sport", "bookmaker");

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_code_key" ON "ShareLink"("code");

-- CreateIndex
CREATE INDEX "ShareLink_code_idx" ON "ShareLink"("code");

-- CreateIndex
CREATE INDEX "ShareLink_createdAt_idx" ON "ShareLink"("createdAt");

-- CreateIndex
CREATE INDEX "EdgeTracking_sport_idx" ON "EdgeTracking"("sport");

-- CreateIndex
CREATE INDEX "EdgeTracking_ensembleMethod_idx" ON "EdgeTracking"("ensembleMethod");

-- CreateIndex
CREATE INDEX "EdgeTracking_outcome_idx" ON "EdgeTracking"("outcome");

-- CreateIndex
CREATE INDEX "EdgeTracking_createdAt_idx" ON "EdgeTracking"("createdAt");

-- CreateIndex
CREATE INDEX "LineMovement_sport_idx" ON "LineMovement"("sport");

-- CreateIndex
CREATE INDEX "LineMovement_kickoff_idx" ON "LineMovement"("kickoff");

-- CreateIndex
CREATE INDEX "LineMovement_isSharpMove_idx" ON "LineMovement"("isSharpMove");

-- CreateIndex
CREATE INDEX "LineMovement_alertSent_idx" ON "LineMovement"("alertSent");

-- CreateIndex
CREATE UNIQUE INDEX "LineMovement_matchId_key" ON "LineMovement"("matchId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "BlogKeyword"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteTeam" ADD CONSTRAINT "FavoriteTeam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
