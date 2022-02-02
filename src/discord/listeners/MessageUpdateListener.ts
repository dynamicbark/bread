import { Message, PartialMessage } from 'discord.js';
import { isEnabledChannel } from '../../utils/DatabaseUtils';
import { attemptMessageDelete } from '../../utils/DiscordUtils';

export async function messageUpdateListener(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage): Promise<void> {
  if (!newMessage.inGuild()) return; // Make sure the message is from a guild
  const channel = newMessage.channel; // For thread check
  const channelId = channel.isThread() && channel.parentId !== null ? channel.parentId : newMessage.channelId; // Treat threads the same as the parent channel
  const isInEnabledChannel = await isEnabledChannel(newMessage.guildId, channelId);
  // Enabled channel checks
  if (isInEnabledChannel) {
    if (newMessage.author.bot) return attemptMessageDelete(newMessage);
    if (newMessage.content !== '🍞') return attemptMessageDelete(newMessage);
  }
}
