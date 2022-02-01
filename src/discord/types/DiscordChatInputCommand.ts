import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types';
import { CommandInteraction } from 'discord.js';

export abstract class DiscordChatInputCommand {
  public readonly commandConfiguration: RESTPostAPIChatInputApplicationCommandsJSONBody;

  constructor(
    commandConfiguration: RESTPostAPIChatInputApplicationCommandsJSONBody
  ) {
    this.commandConfiguration = commandConfiguration;
  }

  abstract handle(commandInteraction: CommandInteraction): Promise<void>;
}
