import { PrismaClient } from '@prisma/client';
import { Client } from 'discord.js';
import 'dotenv/config';
import { messageCreateListener } from './discord/listeners/MessageCreateListener';
import { interactionCreateListener } from './discord/listeners/InteractionCreateListener';
import { readyListener } from './discord/listeners/ReadyListener';
import { messageUpdateListener } from './discord/listeners/MessageUpdateListener';

export const client = new Client({
  intents: ['GUILDS', 'GUILD_MESSAGES'],
});

client.on('interactionCreate', interactionCreateListener);
client.on('messageCreate', messageCreateListener);
client.on('messageUpdate', messageUpdateListener);
client.on('ready', readyListener);

export const prismaClient = new PrismaClient();

async function main() {
  client.login(process.env.DISCORD_TOKEN);
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
