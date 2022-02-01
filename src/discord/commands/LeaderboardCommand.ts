import { ApplicationCommandOptionType } from 'discord-api-types';
import { CommandInteraction } from 'discord.js';
import { getGlobalUsersLeaderboard, getGuildUsersLeaderboard, isEnabledChannel, UserLeaderboardItem } from '../../utils/DatabaseUtils';
import { generateName } from '../../utils/UsernameUtils';
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
            {
              name: 'Global Users',
              value: 'global/users',
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
    if (!['guild/users', 'global/users'].includes(mode)) {
      return commandInteraction.reply({
        content: 'The mode specified is not valid.',
        ephemeral: true,
      });
    }
    if (mode === 'guild/users') {
      // Guild users leaderboard
      outputLines.push('**Leaderboard** (Guild users)');
      outputLines.push('```');
      const guildUsersLeaderboard = await getGuildUsersLeaderboard(commandInteraction.guildId);
      outputLines.push(...formatUsersLeaderboard(guildUsersLeaderboard, commandInteraction.user.id));
      outputLines.push('```');
    } else if (mode === 'global/users') {
      // Global users leaderboard
      outputLines.push('**Leaderboard** (Global users)');
      outputLines.push('```');
      const globalUsersLeaderboard = await getGlobalUsersLeaderboard(commandInteraction.guildId);
      outputLines.push(
        ...formatUsersLeaderboard(globalUsersLeaderboard, commandInteraction.user.id, {
          hideOtherNames: true,
        })
      );
      outputLines.push('```');
    }
    // Send back the generated leaderboard
    const isRunInEnabledChannel = commandInteraction.inGuild()
      ? await isEnabledChannel(commandInteraction.guildId, commandInteraction.channelId)
      : false;
    commandInteraction.reply({
      content: outputLines.join('\n'),
      ephemeral: isRunInEnabledChannel,
    });
  }
}

function formatUsersLeaderboard(
  usersLeaderboard: UserLeaderboardItem[],
  requestUserId: string,
  options?: {
    hideOtherNames?: boolean;
  }
): string[] {
  const hideOtherNames = options?.hideOtherNames || false;
  const outputLines = [];
  for (let i = 0; i < Math.min(10, usersLeaderboard.length); i += 1) {
    const discordTag = formatUserTag(
      hideOtherNames ? requestUserId !== usersLeaderboard[i].user_id : false,
      usersLeaderboard[i].user_id,
      usersLeaderboard[i].username,
      usersLeaderboard[i].discriminator
    );
    outputLines.push(
      formatLeaderboardPlace(usersLeaderboard[i].place).padEnd(5, ' ') +
        ' - ' +
        usersLeaderboard[i].count.toLocaleString('en-US') +
        ' - ' +
        discordTag +
        (requestUserId === usersLeaderboard[i].user_id ? ' (You)' : '')
    );
  }
  return outputLines;
}

function formatUserTag(anonymizeTag: boolean, otherUserId: string, username: string, discriminator: string): string {
  if (!anonymizeTag) return (username + '#' + discriminator).replace(/\`/g, '');
  return generateName(otherUserId + ':' + username + '#' + discriminator).replace(/\`/g, '');
}

function formatLeaderboardPlace(place: number): string {
  if (place === -1) return '';
  const medals = ['🥇', '🥈', '🥉'];
  return `#${place.toLocaleString('en-US')}${medals[place - 1] !== undefined ? ' ' + medals[place - 1] : ''}`;
}
