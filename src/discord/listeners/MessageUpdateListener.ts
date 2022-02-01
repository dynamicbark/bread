import { Message, PartialMessage } from 'discord.js';
import { isEnabledChannel } from '../../utils/DatabaseUtils';
import { attemptDelete } from '../../utils/MessageUtils';

export async function messageUpdateListener(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage): Promise<void> {
  if (!newMessage.inGuild()) return; // Make sure the message is from a guild
  const isInEnabledChannel = await isEnabledChannel(newMessage.guildId, newMessage.channelId);
  // Enabled channel checks
  if (isInEnabledChannel) {
    if (newMessage.author.bot) return attemptDelete(newMessage);
    if (newMessage.content !== '🍞') return attemptDelete(newMessage);
  }
}
