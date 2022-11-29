import { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types';
import { ApplicationCommandDataResolvable, Client, Interaction } from 'discord.js';
import { LeaderboardCommand } from '../commands/LeaderboardCommand';
import { PrivacyCommand } from '../commands/PrivacyCommand';
import { RefreshCommand } from '../commands/RefreshCommand';
import { StatsCommand } from '../commands/StatsCommand';
import { ToggleBreadOnlyCommand } from '../commands/ToggleBreadOnlyCommand';
import { DiscordChatInputCommand } from '../types/DiscordChatInputCommand';

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
        ephemeral: true,
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
          ephemeral: true,
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
