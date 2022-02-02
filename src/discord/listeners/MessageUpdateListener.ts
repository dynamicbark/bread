import { Message, PartialMessage } from 'discord.js';
import { isEnabledChannel } from '../../utils/DatabaseUtils';
import { attemptDelete } from '../../utils/MessageUtils';

export async function messageUpdateListener(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage): Promise<void> {
  if (!newMessage.inGuild()) return; // Make sure the message is from a guild
  const channel = newMessage.channel; // For thread check
  const channelId = channel.isThread() && channel.parentId !== null ? channel.parentId : newMessage.channelId; // Treat threads the same as the parent channel
  const isInEnabledChannel = await isEnabledChannel(newMessage.guildId, channelId);
  // Enabled channel checks
  if (isInEnabledChannel) {
    if (newMessage.author.bot) return attemptDelete(newMessage);
    if (newMessage.content !== '🍞') return attemptDelete(newMessage);
  }
}
