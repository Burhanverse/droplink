import { saveApiKey, deleteApiKey } from './db.mjs';
import { shortenUrl } from './api.mjs';
import { isValidUrl } from './utils.mjs';

export function registerCommands(bot) {
    bot.command('start', async (ctx) => {
        await ctx.reply('Welcome to DropLink Shortener Bot!\n\nCommands:\n/login your_api_key - Set your DropLink API key\n/logout - Remove your API key\n\nOr just send any URL to shorten it!');
    });

    bot.command('login', async (ctx) => {
        const text = ctx.message.text.trim();
        const parts = text.split(' ');

        if (parts.length !== 2) {
            return ctx.reply('Please provide your API key: /login your_api_key');
        }

        const apiKey = parts[1].trim();
        const userId = ctx.from.id;

        try {
            await saveApiKey(userId, apiKey);
            await ctx.reply('API key saved successfully! You can now start shortening URLs.');
        } catch (error) {
            console.error('Error saving API key:', error);
            await ctx.reply('Failed to save API key. Please try again later.');
        }
    });

    bot.command('logout', async (ctx) => {
        const userId = ctx.from.id;

        try {
            const result = await deleteApiKey(userId);
            if (result) {
                await ctx.reply('Your API key has been removed.');
            } else {
                await ctx.reply('You don\'t have an API key saved.');
            }
        } catch (error) {
            console.error('Error removing API key:', error);
            await ctx.reply('Failed to remove API key. Please try again later.');
        }
    });

    // Handle URL messages
    bot.on('message:text', async (ctx) => {
        if (ctx.state.detectedUrl) {
            if (!ctx.state.apiKey) {
                return ctx.reply('Please set your API key first using /login your_api_key');
            }

            const url = ctx.state.detectedUrl;

            // Ask user if they want a custom alias
            await ctx.reply('Do you want to add a custom alias? Reply with the alias or "no".');

            // Store the URL in session for later use
            ctx.session.pendingUrl = url;
        } else if (ctx.session?.pendingUrl) {
            // Handle alias response
            const alias = ctx.message.text.trim() === 'no' ? null : ctx.message.text.trim();
            const url = ctx.session.pendingUrl;

            await ctx.reply('Shortening URL, please wait...');

            const result = await shortenUrl(ctx.state.apiKey, url, alias);

            if (result.success) {
                await ctx.reply(`Here's your shortened URL: ${result.shortUrl}`);
            } else {
                await ctx.reply(`Failed to shorten URL: ${result.error}`);
            }

            // Clear the pending URL
            delete ctx.session.pendingUrl;
        }
    });
}