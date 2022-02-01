import { Client } from 'discord.js';
import { registerCommandsOnDiscord } from './InteractionCreateListener';

export async function readyListener(clientObject: Client<true>): Promise<void> {
  console.log(`Logged in as ${clientObject.user.tag}.`);
  if (process.env.REGISTER_DISCORD_COMMANDS === 'true') {
    console.log('Registering commands on Discord.');
    await registerCommandsOnDiscord(clientObject);
  }
}
