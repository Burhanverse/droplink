import { getApiKey } from './db.mjs';
import { extractUrls } from './utils.mjs';

export function authMiddleware() {
    return async (ctx, next) => {
        const userId = ctx.from.id;
        ctx.state.apiKey = await getApiKey(userId);
        await next();
    };
}

export function urlDetectionMiddleware() {
    return async (ctx, next) => {
        if (ctx.message?.text && !ctx.message.text.startsWith('/')) {
            const urls = extractUrls(ctx.message.text);
            if (urls.length > 0) {
                ctx.state.detectedUrl = urls[0];
            }
        }
        await next();
    };
}