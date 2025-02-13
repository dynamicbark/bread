import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { prismaClient } from '../../index.js';
import { isEnabledChannel } from '../../utils/DatabaseUtils.js';
import { getCurrentCommandInteractionChannelId } from '../../utils/DiscordUtils.js';
import { DiscordChatInputCommand } from '../types/DiscordChatInputCommand.js';

export class ToggleBreadOnlyCommand extends DiscordChatInputCommand {
  constructor() {
    super({
      name: 'togglebreadonly',
      description: 'Toggle if the current channel should be a bread only channel.',
      options: [
        {
          type: ApplicationCommandOptionType.Boolean,
          name: 'allow_custom_emojis',
          description: 'If the custom bread emojis should be allowed in this channel. (Default: false)',
          required: false,
        },
      ],
    });
  }

  async handle(commandInteraction: ChatInputCommandInteraction): Promise<unknown> {
    const currentChannelId = getCurrentCommandInteractionChannelId(commandInteraction);
    if (!commandInteraction.inGuild()) {
      return commandInteraction.reply({
        content: 'This command must be used in a guild.',
        flags: MessageFlags.Ephemeral,
      });
    }
    if (!commandInteraction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
      return commandInteraction.reply({
        content: 'You need to have manage server permissions to toggle the bread only channel state.',
        flags: MessageFlags.Ephemeral,
      });
    }
    if (commandInteraction.channel?.isThread()) {
      return commandInteraction.reply({
        content: 'This command cannot be run in this channel.',
        flags: MessageFlags.Ephemeral,
      });
    }
    const isRunInEnabledChannel = await isEnabledChannel(commandInteraction.guildId, currentChannelId);
    if (isRunInEnabledChannel) {
      await prismaClient.enabledChannel.delete({
        where: {
          guild_id_channel_id: {
            guild_id: BigInt(commandInteraction.guildId),
            channel_id: BigInt(currentChannelId),
          },
        },
      });
      return commandInteraction.reply({
        content: 'The current channel is no longer a bread only channel.',
      });
    } else {
      let allowCustomEmojis = commandInteraction.options.getBoolean('allow_custom_emojis', false);
      if (allowCustomEmojis === null) allowCustomEmojis = false;
      await prismaClient.enabledChannel.create({
        data: {
          guild_id: BigInt(commandInteraction.guildId),
          channel_id: BigInt(currentChannelId),
          allow_custom_emojis: allowCustomEmojis,
        },
      });
      let additionalMessage = '';
      if (
        !commandInteraction.channel ||
        !commandInteraction.guild?.members?.me?.permissionsIn(currentChannelId).has(PermissionFlagsBits.ManageMessages)
      ) {
        additionalMessage = `Please give ${commandInteraction.client.user?.username} the manage messages permission, without this permission, it cannot delete non-bread messages.`;
      }
      return commandInteraction.reply({
        content: [`The current channel is now a bread only channel.${allowCustomEmojis ? ' (With custom emojis)' : ''}`, additionalMessage]
          .join('\n')
          .trim(),
      });
    }
  }
}
