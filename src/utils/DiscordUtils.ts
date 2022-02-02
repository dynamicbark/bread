import { CommandInteraction, Message } from 'discord.js';

export async function attemptMessageDelete(message: Message): Promise<void> {
  if (!message.deletable) return;
  try {
    await message.delete();
  } catch (e) {
    console.log('Failed to delete message.', e);
  }
}

export function getCurrentCommandInteractionChannelId(commandInteraction: CommandInteraction): string {
  if (!commandInteraction.inGuild()) return commandInteraction.channelId;
  const currentChannel = commandInteraction.channel;
  return currentChannel?.isThread() && currentChannel.parentId !== null ? currentChannel.parentId : commandInteraction.channelId;
}
