import { Message } from 'discord.js';
import { isEnabledChannel } from '../../utils/DatabaseUtils';
import { attemptMessageDelete } from '../../utils/DiscordUtils';
import { addToUserQueue, addToCounterQueue } from '../../utils/QueueUtils';

const legacyPrefix = '.:';
const legacyMessageCommands = [
  `${legacyPrefix}help`,
  `${legacyPrefix}invite`,
  `${legacyPrefix}leaderboard`,
  `${legacyPrefix}mark`,
  `${legacyPrefix}stats`,
  `${legacyPrefix}unmark`,
];

export async function messageCreateListener(message: Message): Promise<void> {
  if (!message.inGuild()) return; // Make sure the message is from a guild
  if (message.author.id === message.client.user?.id) return; // Ignore the message if it is from the bot
  const channel = message.channel; // For thread check
  const channelId = channel.isThread() && channel.parentId !== null ? channel.parentId : message.channelId; // Treat threads the same as the parent channel
  const isInEnabledChannel = await isEnabledChannel(message.guildId, channelId);
  // Enabled channel checks
  if (isInEnabledChannel) {
    if (message.author.bot) return attemptMessageDelete(message);
    if (message.content !== '🍞') return attemptMessageDelete(message);
  }
  if (message.author.bot) return; // Ignore bots
  if (message.content.includes('🍞')) {
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
  const currentEpochTime = Math.floor(new Date().getTime() / 1000);
  const disableMessageCommandsReplyEpochTime = 1644037200;
  if (
    !isInEnabledChannel &&
    currentEpochTime < disableMessageCommandsReplyEpochTime &&
    message.guild.me?.permissionsIn(message.channel).has('SEND_MESSAGES') &&
    message.guild.me.permissionsIn(message.channel).has('READ_MESSAGE_HISTORY')
  ) {
    for (let i = 0; i < legacyMessageCommands.length; i += 1) {
      if (message.content.toLowerCase().startsWith(legacyMessageCommands[i])) {
        message.reply({
          content: `${message.client.user?.username} has been updated to no longer use message commands, please type \`/\` to access the new slash commands instead.`,
          allowedMentions: {
            repliedUser: false,
            parse: [],
          },
        });
        return;
      }
    }
  }
}
