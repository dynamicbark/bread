import { Message, PartialMessage } from 'discord.js';
import { inputEqualsValidEmoji } from '../../utils/CustomEmojiUtils';
import { getEnabledChannel } from '../../utils/DatabaseUtils';
import { attemptMessageDelete } from '../../utils/DiscordUtils';

export async function messageUpdateListener(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage): Promise<void> {
  if (!newMessage.inGuild()) return; // Make sure the message is from a guild
  const channel = newMessage.channel; // For thread check
  const channelId = channel.isThread() && channel.parentId !== null ? channel.parentId : newMessage.channelId; // Treat threads the same as the parent channel
  const enabledChannel = await getEnabledChannel(newMessage.guildId, channelId);
  // Enabled channel checks
  if (enabledChannel !== null) {
    // Delete bot messages
    if (newMessage.author.bot) {
      return attemptMessageDelete(newMessage);
    }
    // Delete if it is not the default bread emoji (if custom emojis aren't allowed)
    if (!enabledChannel.allow_custom_emojis && newMessage.content !== '🍞') {
      return attemptMessageDelete(newMessage);
    }
    // Delete if it is not the default bread emoji or custom emojis (if custom emojis are allowed)
    if (enabledChannel.allow_custom_emojis && !inputEqualsValidEmoji(newMessage.content, ['🍞'])) {
      return attemptMessageDelete(newMessage);
    }
  }
}
