import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import { ChatInputCommandInteraction } from 'discord.js';
import {
  getChannelCountForUser,
  getChannelLeaderboardPositionForUser,
  getGlobalChannelCount,
  getGlobalCount,
  getGlobalCountForUser,
  getGlobalGuildCount,
  getGlobalLeaderboardPositionForGuild,
  getGlobalLeaderboardPositionForUser,
  getGuildCountForUser,
  getGuildLeaderboardPositionForUser,
  isEnabledChannel,
} from '../../utils/DatabaseUtils.js';
import { getCurrentCommandInteractionChannelId } from '../../utils/DiscordUtils.js';
import { addToUserQueue } from '../../utils/QueueUtils.js';
import { DiscordChatInputCommand } from '../types/DiscordChatInputCommand.js';

export class StatsCommand extends DiscordChatInputCommand {
  constructor() {
    super({
      name: 'stats',
      description: 'View the stats for a user.',
      options: [
        {
          type: ApplicationCommandOptionType.User,
          name: 'user',
          description: 'The user to lookup.',
          required: false,
        },
      ],
    });
  }

  async handle(commandInteraction: ChatInputCommandInteraction): Promise<unknown> {
    const currentChannelId = getCurrentCommandInteractionChannelId(commandInteraction);
    const outputLines = ['**🍞 Stats**', '```', 'Overall:'];
    // Global (everywhere)
    outputLines.push(`Global  : ${(await getGlobalCount()).toLocaleString('en-US')}`);
    if (commandInteraction.inGuild()) {
      // Global (current guild)
      const globalGuildPosition = await getGlobalLeaderboardPositionForGuild(commandInteraction.guildId);
      const globalGuildCount = await getGlobalGuildCount(commandInteraction.guildId);
      outputLines.push(`Guild   : ${globalGuildCount.toLocaleString('en-US') + formatPlace(globalGuildPosition, globalGuildCount)}`);
      // Global (current channel)
      outputLines.push(`Channel : ${(await getGlobalChannelCount(commandInteraction.guildId, currentChannelId)).toLocaleString('en-US')}`);
    }
    // User stats
    let specifiedUser = commandInteraction.options.getUser('user', false);
    if (specifiedUser === null) {
      specifiedUser = commandInteraction.user;
    }
    addToUserQueue({
      userId: specifiedUser.id,
      username: specifiedUser.username,
      discriminator: specifiedUser.discriminator,
    });
    outputLines.push(`---`);
    outputLines.push(`${specifiedUser.tag.replace(/\^/g, '')}:`);
    // User (everywhere)
    const userGlobalPosition = await getGlobalLeaderboardPositionForUser(specifiedUser.id);
    const userGlobalCount = await getGlobalCountForUser(specifiedUser.id);
    outputLines.push(`Global  : ${userGlobalCount.toLocaleString('en-US') + formatPlace(userGlobalPosition, userGlobalCount)}`);
    if (commandInteraction.inGuild()) {
      // User (guild)
      const userGuildPosition = await getGuildLeaderboardPositionForUser(commandInteraction.guildId, specifiedUser.id);
      const userGuildCount = await getGuildCountForUser(commandInteraction.guildId, specifiedUser.id);
      outputLines.push(`Guild   : ${userGuildCount.toLocaleString('en-US') + formatPlace(userGuildPosition, userGuildCount)}`);
      // User (channel)
      const userChannelPosition = await getChannelLeaderboardPositionForUser(
        commandInteraction.guildId,
        currentChannelId,
        specifiedUser.id
      );
      const userChannelCount = await getChannelCountForUser(commandInteraction.guildId, currentChannelId, specifiedUser.id);
      outputLines.push(`Channel : ${userChannelCount.toLocaleString('en-US') + formatPlace(userChannelPosition, userChannelCount)}`);
    }
    outputLines.push('```');
    // Send back the generated stats
    const isRunInEnabledChannel = commandInteraction.inGuild()
      ? await isEnabledChannel(commandInteraction.guildId, currentChannelId)
      : false;
    commandInteraction.reply({
      content: outputLines.join('\n'),
      ephemeral: isRunInEnabledChannel,
    });
    return;
  }
}

function formatPlace(place: number, count: bigint): string {
  if (count === BigInt(0)) return '';
  if (place === -1) return '';
  const medals = ['🥇', '🥈', '🥉'];
  return ` (#${place.toLocaleString('en-US')}${medals[place - 1] !== undefined ? ' ' + medals[place - 1] : ''})`;
}
