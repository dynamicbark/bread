import { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ApplicationCommandDataResolvable, Client, Interaction, MessageFlags } from 'discord.js';
import { LeaderboardCommand } from '../commands/LeaderboardCommand.js';
import { PrivacyCommand } from '../commands/PrivacyCommand.js';
import { RefreshCommand } from '../commands/RefreshCommand.js';
import { StatsCommand } from '../commands/StatsCommand.js';
import { ToggleBreadOnlyCommand } from '../commands/ToggleBreadOnlyCommand.js';
import { DiscordChatInputCommand } from '../types/DiscordChatInputCommand.js';

const globalChatInputCommandMap = new Map<string, DiscordChatInputCommand>();

function registerGlobalChatInputCommand(discordChatInputCommand: DiscordChatInputCommand): void {
  globalChatInputCommandMap.set(discordChatInputCommand.commandConfiguration.name, discordChatInputCommand);
}

registerGlobalChatInputCommand(new LeaderboardCommand());
registerGlobalChatInputCommand(new PrivacyCommand());
registerGlobalChatInputCommand(new RefreshCommand());
registerGlobalChatInputCommand(new StatsCommand());
registerGlobalChatInputCommand(new ToggleBreadOnlyCommand());

export async function interactionCreateListener(interaction: Interaction): Promise<void> {
  if (interaction.isCommand()) {
    const discordCommand = globalChatInputCommandMap.get(interaction.commandName);
    if (!discordCommand) {
      await interaction.reply({
        content: 'The command requested was not found.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    try {
      await discordCommand.handle(interaction);
    } catch (e) {
      console.log('The command encounter an error while running.', e);
      if (interaction.deferred) {
        await interaction.editReply({
          content: 'The command encoutered an error while running.',
        });
      } else if (interaction.replied) {
        await interaction.followUp({
          content: 'The command encountered an error while running.',
        });
      } else {
        await interaction.reply({
          content: 'The command encountered an error while running.',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
    return;
  }
}

export async function registerCommandsOnDiscord(client: Client<true>) {
  const globalCommands: RESTPostAPIApplicationCommandsJSONBody[] = [];
  globalChatInputCommandMap.forEach((globalChatInputCommand) => {
    globalCommands.push(globalChatInputCommand.commandConfiguration);
  });
  await client.application.commands.set(globalCommands as unknown as ApplicationCommandDataResolvable[]);
}
