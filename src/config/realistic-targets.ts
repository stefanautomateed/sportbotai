/**
 * Realistic Outreach Targets
 * 
 * These are indie/small tools that would likely respond to badge exchange.
 * Excludes big brands (FantasyPros, ESPN, The Athletic, etc.)
 * 
 * Usage in review generation: 
 *   npx tsx scripts/test-backlink-scout.ts --reviews --realistic --live
 */

// Big brands to SKIP (won't respond to badge exchange)
export const BIG_BRANDS = [
    // Major media/sports
    'espn.com', 'theathletic.com', 'fivethirtyeight.com',
    'flashscore.com', 'sofascore.com', 'livescore.com',

    // Big fantasy platforms
    'fantasypros.com', 'rotowire.com', 'rotogrinders.com',
    'prizepicks.com', 'underdogfantasy.com', 'sleeper.com',

    // Major analytics/news
    'actionnetwork.com', 'covers.com', 'bettingpros.com',
    'numberfire.com', 'teamrankings.com',

    // Big data providers
    'sportradar.com', 'geniussports.com', 'statsbomb.com',
    'betradar.com', 'betgenius.com',

    // Major reference sites
    'pro-football-reference.com', 'basketball-reference.com',
    'hockey-reference.com', 'baseball-reference.com',
    'fbref.com', 'transfermarkt.com', 'whoscored.com',

    // Prediction markets
    'polymarket.com', 'metaculus.com', 'predictit.org',

    // Major odds/reviews
    'oddschecker.com', 'oddsportal.com', 'oddspedia.com',
    'sportsbookreview.com', 'bookies.com',

    // VSiN and similar
    'vsin.com', 'legalsportsreport.com', 'egr.global',
];

// REALISTIC targets - indie tools likely to respond
export const REALISTIC_TARGETS = [
    // Positive EV tools (small teams)
    'oddsview.com',
    'sharp.app',
    'beebettor.com',
    'gamedaymath.com',
    '8rainstation.com',
    'pinnacleoddsdropper.com',
    'bettorodds.com',
    'doinksports.com',
    'propprofessor.com',
    'optimal.bet',

    // Arbitrage (indie)
    'darkhorseodds.com',
    'doubledownarbs.com',
    'picktheodds.app',
    'oddspotato.com',
    'oddspulse.com',

    // Research tools (small teams)
    'hofbets.com',
    'props.cash',
    'rithmm.com',
    'solvedsports.com',
    'parlayscience.com',
    'datawisebets.com',
    'ballparkpal.com',
    'betalytics.com',
    'evanalytics.com',
    'edghouse.com',
    'linemate.io',
    'xep.ai',
    'gridironai.com',
    'thepowerrank.com',
    'pocketprops.com',
    'shotqualitybets.com',
    'outlier.bet',

    // Bet tracking (indie)
    'sportsbookscout.com',
    'betrecaps.com',
    'juicereel.com',
    'gambly.com',

    // Odds screen (indie)
    'spankodds.com',
    'oddslogic.com',
    'metabet.io',

    // Social/Exchange (smaller)
    'thrillzz.com',
    'kutt.com',
    'rebet.com',
    'propswap.com',
    'vaultsportshq.com',

    // Picks (indie)
    'raspicks.com',
    'juicedbets.com',

    // Other indie tools
    'bettingtools.co',
    'smartbettingclub.com',
    'oddsconverter.co.uk',

    // The oddsjam/rebelbetting - mid-size might respond
    'oddsjam.com',
    'rebelbetting.com',
    'betburger.com',

    // The competitor backlink tools we identified
    'toolify.ai',
    'foxdata.com',
    'bettoredge.com',
    'fundz.net',
    'sellbery.com',
    'dubclub.win',
    'openvc.app',
];

// Helper to check if a URL is a realistic target
export function isRealisticTarget(url: string): boolean {
    const domain = new URL(url).hostname.replace('www.', '').toLowerCase();

    // Check if it's a big brand (skip)
    if (BIG_BRANDS.some(big => domain.includes(big.replace('www.', '')))) {
        return false;
    }

    // Check if it's explicitly a realistic target
    if (REALISTIC_TARGETS.some(target => domain.includes(target.replace('www.', '')))) {
        return true;
    }

    // Default: if not a known big brand, treat as potentially realistic
    // (for new discoveries that aren't in either list)
    return true;
}
