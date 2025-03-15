import { getApiKey } from './db.mjs';
import { extractUrls } from './utils.mjs';
import { deleteApiKey } from './db.mjs';

export function authMiddleware() {
    return async (ctx, next) => {
        if (!ctx.state) {
            ctx.state = {};
        }

        if (ctx.from) {
            const userId = ctx.from.id;
            ctx.state.apiKey = await getApiKey(userId);
        } else {
            ctx.state.apiKey = null;
        }
        await next();
    };
}

export function urlDetectionMiddleware() {
    return async (ctx, next) => {
        if (!ctx.state) {
            ctx.state = {};
        }

        if (ctx.message?.text && !ctx.message.text.startsWith('/')) {
            const urls = extractUrls(ctx.message.text);
            if (urls.length > 0) {
                ctx.state.detectedUrl = urls[0];
            }
        }
        await next();
    };
}

// Handle bot errors including blocked users
export function handleBotError(err) {
    const ctx = err.ctx;

    // Check if error is related to user blocking the bot
    if (err.error?.description &&
        (err.error.description.includes("bot was blocked by the user") ||
            err.error.description.includes("user is deactivated") ||
            err.error.description.includes("chat not found") ||
            err.error.description.includes("PEER_ID_INVALID"))) {

        // Extract user ID from context if available
        const userId = ctx?.from?.id;

        if (userId) {
            // Remove user's data from database
            console.log(`User ${userId} blocked the bot. Removing from database...`);
            deleteApiKey(userId).catch(e => {
                console.error(`Failed to remove blocked user ${userId} from database:`, e);
            });
        }
    }

    console.error(`Bot error occurred: ${err.error.description || err.message}`);
}