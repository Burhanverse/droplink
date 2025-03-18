import { saveApiKey, deleteApiKey, isApiKeyUsed } from './db.mjs';
import { shortenUrl } from './api.mjs';
import { isValidUrl } from './utils.mjs';

export function registerCommands(bot) {
    bot.command('start', async (ctx) => {
        await ctx.reply('*Welcome to DropLink Shortener Bot*!\n\n*You must login with your own API key to use this bot*\n*Commands:*\n`/login` your_api_key - Set your DropLink API key\n`/logout` - Remove your API key\n\nAfter logging in, just send any URL to shorten it!', {
            parse_mode: "Markdown"
        });
    });

    bot.command('login', async (ctx) => {
        const text = ctx.message.text.trim();
        const parts = text.split(' ');

        if (parts.length !== 2) {
            return ctx.reply('<b>Please provide your API key:</b> /login your_api_key', {
                parse_mode: "HTML"
            });
        }

        const apiKey = parts[1].trim();
        const userId = ctx.from.id;

        try {
            // Check if user already has an API key
            const existingKey = await getApiKey(userId);
            if (existingKey) {
                return ctx.reply('<b>⚠️ You already have an API key saved.</b>\n\nPlease use /logout first to remove your existing API key before setting a new one.', {
                    parse_mode: "HTML"
                });
            }

            // Check if API key is used by another user
            const isUsed = await isApiKeyUsed(apiKey, userId);
            if (isUsed) {
                return ctx.reply('<b>⚠️ This API key is already being used by another user.</b>\n\nPlease provide a different API key.', {
                    parse_mode: "HTML"
                });
            }

            await saveApiKey(userId, apiKey);
            await ctx.reply('<b>✅ API key saved successfully!</b>\n\nYou can now start shortening URLs.', {
                parse_mode: "HTML"
            });
        } catch (error) {
            console.error('Error saving API key:', error);
            await ctx.reply('<b>❌ Failed to save API key.</b>\n\nPlease try again later.', {
                parse_mode: "HTML"
            });
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
                return ctx.reply('⚠️ You need to set your API key first using /login your_api_key before shortening URLs.');
            }

            const url = ctx.state.detectedUrl;

            if (!isValidUrl(url)) {
                return ctx.reply('Invalid URL detected. Please try again.');
            }

            ctx.session.pendingUrl = url;

            // Create inline keyboard with Yes/No options for custom alias
            await ctx.reply('Do you want to add a custom alias?', {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "Yes", callback_data: "alias_yes" },
                            { text: "No", callback_data: "alias_no" }
                        ]
                    ]
                }
            });

        } else if (ctx.session?.pendingUrl) {
            const alias = ctx.message.text.trim() === 'no' ? null : ctx.message.text.trim();
            const url = ctx.session.pendingUrl;

            await ctx.reply('Shortening URL, please wait...');

            const result = await shortenUrl(ctx.state.apiKey, url, alias);

            if (result.success) {
                await ctx.reply(`Here's your shortened URL: ${result.shortUrl}`);
            } else {
                await ctx.reply(`Failed to shorten URL: ${result.error}`);
            }

            delete ctx.session.pendingUrl;
        }
    });

    // Handle inline keyboard callbacks
    bot.callbackQuery("alias_yes", async (ctx) => {
        await ctx.answerCallbackQuery();
        await ctx.reply("Please enter your custom alias:");
        ctx.session.awaitingAlias = true;
    });

    bot.callbackQuery("alias_no", async (ctx) => {
        await ctx.answerCallbackQuery();

        const url = ctx.session.pendingUrl;
        if (!url) {
            return ctx.reply("Sorry, your URL was not found. Please send it again.");
        }

        await ctx.reply('Shortening URL without custom alias, please wait...');

        const result = await shortenUrl(ctx.state.apiKey, url, null);

        if (result.success) {
            await ctx.reply(`Here's your shortened URL: ${result.shortUrl}`);
        } else {
            await ctx.reply(`Failed to shorten URL: ${result.error}`);
        }

        delete ctx.session.pendingUrl;
    });

    // Handle alias input after user clicked "Yes"
    bot.on('message:text', async (ctx) => {
        if (ctx.session?.awaitingAlias && ctx.session?.pendingUrl) {
            const alias = ctx.message.text.trim();
            const url = ctx.session.pendingUrl;

            await ctx.reply('Shortening URL with custom alias, please wait...');

            const result = await shortenUrl(ctx.state.apiKey, url, alias);

            if (result.success) {
                await ctx.reply(`Here's your shortened URL: ${result.shortUrl}`);
            } else {
                await ctx.reply(`Failed to shorten URL: ${result.error}`);
            }

            delete ctx.session.pendingUrl;
            delete ctx.session.awaitingAlias;
        }
    }, { suppress: true });
}