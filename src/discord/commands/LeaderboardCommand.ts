import { ApplicationCommandOptionType } from 'discord-api-types';
import { ChatInputCommandInteraction, CommandInteraction } from 'discord.js';
import {
  getGlobalUsersLeaderboard,
  getGuildUsersLeaderboard,
  getUser,
  isEnabledChannel,
  UserLeaderboardItem,
} from '../../utils/DatabaseUtils';
import { getCurrentCommandInteractionChannelId } from '../../utils/DiscordUtils';
import { getPrivateNameForUser } from '../../utils/UsernameUtils';
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

  async handle(commandInteraction: ChatInputCommandInteraction): Promise<unknown> {
    const currentChannelId = getCurrentCommandInteractionChannelId(commandInteraction);
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
      const formattedLeaderboardLines = await formatUsersLeaderboard(guildUsersLeaderboard, BigInt(commandInteraction.user.id));
      outputLines.push(...(formattedLeaderboardLines.length === 0 ? ['No data.'] : formattedLeaderboardLines));
      outputLines.push('```');
    } else if (mode === 'global/users') {
      // Global users leaderboard
      outputLines.push('**Leaderboard** (Global users)');
      outputLines.push('```');
      const globalUsersLeaderboard = await getGlobalUsersLeaderboard(commandInteraction.guildId);
      const formattedLeaderboardLines = await formatUsersLeaderboard(globalUsersLeaderboard, BigInt(commandInteraction.user.id), {
        hideOtherNames: true,
      });
      outputLines.push(...(formattedLeaderboardLines.length === 0 ? ['No data.'] : formattedLeaderboardLines));
      outputLines.push('```');
    }
    // Send back the generated leaderboard
    const isRunInEnabledChannel = commandInteraction.inGuild()
      ? await isEnabledChannel(commandInteraction.guildId, currentChannelId)
      : false;
    commandInteraction.reply({
      content: outputLines.join('\n'),
      ephemeral: isRunInEnabledChannel,
    });
  }
}

async function formatUsersLeaderboard(
  usersLeaderboard: UserLeaderboardItem[],
  requestUserId: bigint,
  options?: {
    hideOtherNames?: boolean;
  }
): Promise<string[]> {
  const hideOtherNames = options?.hideOtherNames || false;
  const outputLines = [];
  for (let i = 0; i < Math.min(10, usersLeaderboard.length); i += 1) {
    const shouldHideName = hideOtherNames ? requestUserId !== usersLeaderboard[i].user_id : false;
    const user = await getUser(usersLeaderboard[i].user_id);
    if (user === null) continue;
    let hiddenName = user.private_name;
    if (shouldHideName && hiddenName === null) {
      hiddenName = await getPrivateNameForUser(user.id);
    }
    const displayName = cleanDisplayName(shouldHideName && user.privacy_enabled ? hiddenName! : `${user.username}#${user.discriminator}`);
    outputLines.push(
      formatLeaderboardPlace(usersLeaderboard[i].place).padEnd(5, ' ') +
        ' - ' +
        usersLeaderboard[i].count.toLocaleString('en-US') +
        ' - ' +
        displayName +
        (requestUserId === usersLeaderboard[i].user_id ? ' (You)' : '')
    );
  }
  return outputLines;
}

function cleanDisplayName(displayName: string): string {
  return displayName.replace(/\`/g, '');
}

function formatLeaderboardPlace(place: number): string {
  if (place === -1) return '';
  const medals = ['🥇', '🥈', '🥉'];
  return `#${place.toLocaleString('en-US')}${medals[place - 1] !== undefined ? ' ' + medals[place - 1] : ''}`;
}
