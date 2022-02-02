import { Message } from 'discord.js';

export async function attemptDelete(message: Message): Promise<void> {
  if (!message.deletable) return;
  try {
    await message.delete();
  } catch (e) {
    console.log('Failed to delete message.', e);
  }
}
