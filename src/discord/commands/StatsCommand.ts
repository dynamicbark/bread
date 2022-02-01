import { ApplicationCommandOptionType } from 'discord-api-types';
import { CommandInteraction } from 'discord.js';
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
  isEnabledChannel,
} from '../../utils/DatabaseUtils';
import { addToCachedUserQueue } from '../../utils/QueueUtils';
import { DiscordChatInputCommand } from '../types/DiscordChatInputCommand';

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

  async handle(commandInteraction: CommandInteraction): Promise<void> {
    const outputLines = ['**🍞 Stats**', '```', 'Overall:'];
    // Global (everywhere)
    outputLines.push(
      `Global  : ${(await getGlobalCount()).toLocaleString('en-US')}`
    );
    if (commandInteraction.inGuild()) {
      // Global (current guild)
      const globalGuildPosition = await getGlobalLeaderboardPositionForGuild(
        commandInteraction.guildId
      );
      outputLines.push(
        `Guild   : ${
          (
            await getGlobalGuildCount(commandInteraction.guildId)
          ).toLocaleString('en-US') + formatPlace(globalGuildPosition)
        }`
      );
      // Global (current channel)
      outputLines.push(
        `Channel : ${(
          await getGlobalChannelCount(
            commandInteraction.guildId,
            commandInteraction.channelId
          )
        ).toLocaleString('en-US')}`
      );
    }
    // User stats
    let specifiedUser = commandInteraction.options.getUser('user', false);
    if (specifiedUser === null) {
      specifiedUser = commandInteraction.user;
    }
    addToCachedUserQueue({
      userId: specifiedUser.id,
      username: specifiedUser.username,
      discriminator: specifiedUser.discriminator,
    });
    outputLines.push(`---`);
    outputLines.push(`${specifiedUser.tag.replace(/\^/g, '')}:`);
    // User (everywhere)
    const userGlobalPosition = await getGlobalLeaderboardPositionForUser(
      specifiedUser.id
    );
    outputLines.push(
      `Global  : ${
        (await getGlobalCountForUser(specifiedUser.id)).toLocaleString(
          'en-US'
        ) + formatPlace(userGlobalPosition)
      }`
    );
    if (commandInteraction.inGuild()) {
      // User (guild)
      const userGuildPosition = await getGlobalLeaderboardPositionForUser(
        specifiedUser.id
      );
      outputLines.push(
        `Guild   : ${
          (
            await getGuildCountForUser(
              commandInteraction.guildId,
              specifiedUser.id
            )
          ).toLocaleString('en-US') + formatPlace(userGuildPosition)
        }`
      );
      // User (channel)
      const userChannelPosition = await getChannelLeaderboardPositionForUser(
        commandInteraction.guildId,
        commandInteraction.channelId,
        specifiedUser.id
      );
      outputLines.push(
        `Channel : ${
          (
            await getChannelCountForUser(
              commandInteraction.guildId,
              commandInteraction.channelId,
              specifiedUser.id
            )
          ).toLocaleString('en-US') + formatPlace(userChannelPosition)
        }`
      );
    }
    outputLines.push('```');
    // Send back the generated stats
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

function formatPlace(place: number): string {
  if (place === -1) return '';
  const medals = ['🥇', '🥈', '🥉'];
  return ` (#${place.toLocaleString('en-US')}${
    medals[place - 1] !== undefined ? ' ' + medals[place - 1] : ''
  })`;
}
