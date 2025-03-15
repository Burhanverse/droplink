import { Bot, session } from 'grammy';
import { connectToDatabase } from './ext/db.mjs';
import { authMiddleware, urlDetectionMiddleware, handleBotError } from './ext/middleware.mjs';
import { registerCommands } from './ext/commands.mjs';
import dotenv from 'dotenv';

dotenv.config();

async function startBot() {
    try {
        await connectToDatabase();

        const bot = new Bot(process.env.BOT_TOKEN);

        bot.use(session({
            initial: () => ({})
        }));

        bot.use(authMiddleware());
        bot.use(urlDetectionMiddleware());

        registerCommands(bot);

        bot.catch((err) => {
            console.error('Bot error occurred:', err);
        });

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
