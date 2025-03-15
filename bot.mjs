import { Bot, session } from 'grammy';
import { connectToDatabase } from './ext/db.mjs';
import { authMiddleware, urlDetectionMiddleware } from './ext/middleware.mjs';
import { registerCommands } from './ext/commands.mjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function startBot() {
    try {
        // Connect to database
        await connectToDatabase();

        // Initialize the bot
        const bot = new Bot(process.env.BOT_TOKEN);

        // Use session middleware
        bot.use(session({
            initial: () => ({})
        }));

        // Register custom middlewares
        bot.use(authMiddleware());
        bot.use(urlDetectionMiddleware());

        // Register commands
        registerCommands(bot);

        // Catch bot errors
        bot.catch((err) => {
            console.error('Bot error occurred:', err);
        });

        // Start the bot
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
