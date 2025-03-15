import { Bot, session } from 'grammy';
import { connectToDatabase } from './ext/db.mjs';
import { registerCommands } from './ext/commands.mjs';
import { authMiddleware, urlDetectionMiddleware, handleBotError, privateChatsOnlyMiddleware } from './ext/middleware.mjs';
import dotenv from 'dotenv';

dotenv.config();

async function startBot() {
    try {
        await connectToDatabase();

        const bot = new Bot(process.env.BOT_TOKEN);

        bot.use(session({
            initial: () => ({})
        }));

        bot.use(privateChatsOnlyMiddleware());
        bot.use(authMiddleware());
        bot.use(urlDetectionMiddleware());

        registerCommands(bot);

        bot.catch(handleBotError);

        await bot.start({
            drop_pending_updates: true
        });
        console.log('Bot started successfully!');
    } catch (error) {
        console.error('Failed to start bot:', error);
        process.exit(1);
    }
}

startBot();
