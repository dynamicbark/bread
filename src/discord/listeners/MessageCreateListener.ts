import { Message } from 'discord.js';
import { inputContainsValidEmoji, inputEqualsValidEmoji } from '../../utils/CustomEmojiUtils';
import { getEnabledChannel } from '../../utils/DatabaseUtils';
import { attemptMessageDelete } from '../../utils/DiscordUtils';
import { addToUserQueue, addToCounterQueue } from '../../utils/QueueUtils';

export async function messageCreateListener(message: Message): Promise<void> {
  if (!message.inGuild()) return; // Make sure the message is from a guild
  if (message.author.id === message.client.user?.id) return; // Ignore the message if it is from the bot
  const channel = message.channel; // For thread check
  const channelId = channel.isThread() && channel.parentId !== null ? channel.parentId : message.channelId; // Treat threads the same as the parent channel
  const enabledChannel = await getEnabledChannel(message.guildId, channelId);
  // Enabled channel checks
  if (enabledChannel !== null) {
    // Delete bot messages
    if (message.author.bot) {
      return attemptMessageDelete(message);
    }
    // Delete if it is not the default bread emoji (if custom emojis aren't allowed)
    if (!enabledChannel.allow_custom_emojis && message.content !== '🍞') {
      return attemptMessageDelete(message);
    }
    // Delete if it is not the default bread emoji or custom emojis (if custom emojis are allowed)
    if (enabledChannel.allow_custom_emojis && !inputEqualsValidEmoji(message.content, ['🍞'])) {
      return attemptMessageDelete(message);
    }
  }
  if (message.author.bot) return; // Ignore bots
  // If the message contains a valid emoji (invalid messages have already been ignored)
  if (inputContainsValidEmoji(message.content, ['🍞'])) {
    addToCounterQueue({
      guildId: message.guildId,
      channelId,
      userId: message.author.id,
    });
    addToUserQueue({
      userId: message.author.id,
      username: message.author.username,
      discriminator: message.author.discriminator,
    });
  }
}
