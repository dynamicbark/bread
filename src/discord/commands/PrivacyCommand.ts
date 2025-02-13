import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { prismaClient } from '../../index.js';
import { getUser } from '../../utils/DatabaseUtils.js';
import { userQueueItemProcess } from '../../utils/QueueUtils.js';
import { generateRandomPrivateNameForUser, getPrivateNameForUser } from '../../utils/UsernameUtils.js';
import { DiscordChatInputCommand } from '../types/DiscordChatInputCommand.js';

export class PrivacyCommand extends DiscordChatInputCommand {
  constructor() {
    super({
      name: 'privacy',
      description: 'Manage your own privacy info.',
      options: [
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'info',
          description: 'Check your current privacy info.',
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'rotatename',
          description: 'Generate a new private name for yourself.',
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'toggle',
          description: 'Toggle your current privacy status.',
        },
      ],
    });
  }

  async handle(commandInteraction: ChatInputCommandInteraction): Promise<unknown> {
    // Add the user to the database if they aren't there
    await new Promise((resolve) => {
      userQueueItemProcess(
        {
          userId: commandInteraction.user.id,
          username: commandInteraction.user.username,
          discriminator: commandInteraction.user.discriminator,
        },
        resolve,
      );
    });
    const user = await getUser(BigInt(commandInteraction.user.id));
    // Determine subcommand
    const subcommandUsed = commandInteraction.options.getSubcommand(true);
    if (subcommandUsed === 'info') {
      // View current privacy info
      const currentPrivateName = await getPrivateNameForUser(BigInt(commandInteraction.user.id));
      return commandInteraction.reply({
        content: [
          '**Privacy Info**',
          '```',
          `Private Name: ${currentPrivateName}`,
          `Privacy Enabled: ${user?.privacy_enabled ? 'Yes' : 'No'}`,
          '```',
        ].join('\n'),
        flags: MessageFlags.Ephemeral,
      });
    } else if (subcommandUsed === 'rotatename') {
      // Rotate the private name
      const generatedPrivateName = await generateRandomPrivateNameForUser(BigInt(commandInteraction.user.id));
      return commandInteraction.reply({
        content: `Your private name has been changed to \`${generatedPrivateName}\`.`,
        flags: MessageFlags.Ephemeral,
      });
    } else if (subcommandUsed === 'toggle') {
      // Toggle the privacy state
      const newPrivacyEnabledState = !user?.privacy_enabled;
      await prismaClient.user.update({
        where: {
          id: user?.id,
        },
        data: {
          privacy_enabled: newPrivacyEnabledState,
        },
      });
      return commandInteraction.reply({
        content: `Your privacy mode has been \`${newPrivacyEnabledState === true ? 'enabled' : 'disabled'}\`.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
