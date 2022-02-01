import { ApplicationCommandOptionType } from 'discord-api-types';
import { CommandInteraction } from 'discord.js';
import {
  getGuildUsersLeaderboard,
  isEnabledChannel,
} from '../../utils/DatabaseUtils';
import { DiscordChatInputCommand } from '../types/DiscordChatInputCommand';

export class LeaderboardCommand extends DiscordChatInputCommand {
  constructor() {
    super({
      name: 'leaderboard',
      description: 'View the leaderboard.',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'mode',
          description: 'The leaderboard to show.',
          required: false,
          choices: [
            {
              name: 'Guild Users',
              value: 'guild/users',
            },
          ],
        },
      ],
    });
  }

  async handle(commandInteraction: CommandInteraction): Promise<void> {
    if (!commandInteraction.inGuild()) {
      return commandInteraction.reply({
        content: 'This command must be used in a guild.',
        ephemeral: true,
      });
    }
    const outputLines = [];
    let mode = commandInteraction.options.getString('mode', false);
    if (mode === null) mode = 'guild/users';
    // Check to see if a valid mode is specified
    if (!['guild/users'].includes(mode)) {
      return commandInteraction.reply({
        content: 'The mode specified is not valid.',
        ephemeral: true,
      });
    }
    if (mode === 'guild/users') {
      // Guild users leaderboard
      outputLines.push('**Leaderboard** (Guild users)');
      outputLines.push('```');
      const guildUsersLeaderboard = await getGuildUsersLeaderboard(
        commandInteraction.guildId
      );
      for (let i = 0; i < Math.min(10, guildUsersLeaderboard.length); i += 1) {
        const discordTagCleaned = (
          guildUsersLeaderboard[i].username +
          '#' +
          guildUsersLeaderboard[i].discriminator
        ).replace(/\`/g, '');
        outputLines.push(
          formatLeaderboardPlace(guildUsersLeaderboard[i].place) +
            ' - ' +
            guildUsersLeaderboard[i].count.toLocaleString('en-US') +
            ' - ' +
            discordTagCleaned
        );
      }
      outputLines.push('```');
    }
    // Send back the generated leaderboard
    const isRunInEnabledChannel = commandInteraction.inGuild()
      ? await isEnabledChannel(
          commandInteraction.guildId,
          commandInteraction.channelId
        )
      : false;
    commandInteraction.reply({
      content: outputLines.join('\n'),
      ephemeral: isRunInEnabledChannel,
    });
  }
}

function formatLeaderboardPlace(place: number): string {
  if (place === -1) return '';
  const medals = ['🥇', '🥈', '🥉'];
  return `#${place.toLocaleString('en-US')}${
    medals[place - 1] !== undefined ? ' ' + medals[place - 1] : ''
  }`;
}
