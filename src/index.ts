import { PrismaClient } from '@prisma/client';
import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';
import express from 'express';
import { interactionCreateListener } from './discord/listeners/InteractionCreateListener.js';
import { messageCreateListener } from './discord/listeners/MessageCreateListener.js';
import { messageUpdateListener } from './discord/listeners/MessageUpdateListener.js';
import { readyListener } from './discord/listeners/ReadyListener.js';
import { updateGlobalEmojiList } from './utils/CustomEmojiUtils.js';
import { authCallbackRoute } from './web/routes/AuthCallbackRoute.js';
import { authStartRoute } from './web/routes/AuthStartRoute.js';

export const expressApplication = express();

export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.on('interactionCreate', interactionCreateListener);
client.on('messageCreate', messageCreateListener);
client.on('messageUpdate', messageUpdateListener);
client.on('ready', readyListener);

expressApplication.disable('x-powered-by');
expressApplication.get('/auth/start', authStartRoute);
expressApplication.get('/auth/callback', authCallbackRoute);

export const prismaClient = new PrismaClient();

async function main() {
  client.login(process.env.DISCORD_TOKEN);
  expressApplication.listen(Number(process.env.WEB_SERVER_PORT) || '8080');
  await updateGlobalEmojiList();
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
