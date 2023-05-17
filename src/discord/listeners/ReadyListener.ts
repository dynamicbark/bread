import { Client } from 'discord.js';
import { registerCommandsOnDiscord } from './InteractionCreateListener.js';

export async function readyListener(clientObject: Client<true>): Promise<void> {
  console.log(`Logged in as ${clientObject.user.tag}.`);
  if (process.env.REGISTER_DISCORD_COMMANDS === 'true') {
    console.log('Registering commands on Discord.');
    await registerCommandsOnDiscord(clientObject);
  }
  if (process.env.REGISTER_DISCORD_METADATA === 'true') {
    console.log('Registering metadata on Discord.');
    await clientObject.rest.put(`/applications/${clientObject.application.id}/role-connections/metadata`, {
      body: [
        {
          key: 'totalcount',
          name: 'Total Sent',
          description: 'The total bread sent by the user.',
          type: 2, // number_gt
        },
      ],
    });
  }
}
