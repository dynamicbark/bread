import { Message } from 'discord.js';

export async function attemptDelete(message: Message): Promise<void> {
  if (!message.deletable) return;
  await message.delete();
}
