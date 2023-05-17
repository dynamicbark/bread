import { User } from '@prisma/client';
import { CommandInteraction, Message } from 'discord.js';
import { client, prismaClient } from '../index.js';
import { getGlobalCountForUser, getUser } from './DatabaseUtils.js';
import { userQueueItemProcess } from './QueueUtils.js';

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

export async function getUserOauth2AccessToken(userId: string): Promise<
  | {
      error: undefined;
      accessToken: string;
    }
  | {
      error: 'UNKNOWN_USER' | 'REFRESH_TOKEN_RATELIMITED' | 'INVALID_REFRESH_TOKEN';
    }
> {
  let user: User | null = null;
  try {
    user = await getUser(BigInt(userId));
    if (!user) {
      throw new Error('User not found in the database.');
    }
  } catch (e) {
    // Add the user to the database if they aren't there
    await new Promise((resolve) => {
      userQueueItemProcess(
        {
          userId,
          username: 'Unknown User',
          discriminator: '0000',
        },
        resolve
      );
    });
  }
  if (!user || !user?.oauth2_token_response) {
    return {
      error: 'UNKNOWN_USER',
    };
  }
  const userOauth2Json = JSON.parse(user.oauth2_token_response);
  // Get the user info (to check to see if the token is valid)
  const usersMeResponse = await fetch('https://discord.com/api/users/@me', {
    headers: {
      authorization: `${userOauth2Json.token_type} ${userOauth2Json.access_token}`,
    },
  });
  let accessToken = userOauth2Json.access_token;
  if (usersMeResponse.status !== 200) {
    // Attempt refresh token
    const reqBodyParams: Record<string, string> = {
      client_id: client.application?.id || '',
      client_secret: process.env.DISCORD_CLIENT_SECRET || '',
      grant_type: 'refresh_token',
      refresh_token: userOauth2Json.refresh_token,
    };
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'post',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(reqBodyParams),
    });
    // If there was an error attempting the refresh
    if (tokenResponse.status !== 200) {
      if (tokenResponse.status === 429) {
        return {
          error: 'REFRESH_TOKEN_RATELIMITED',
        };
      }
      // Delete the invalid token from the database
      await prismaClient.user.update({
        where: {
          id: BigInt(userId),
        },
        data: {
          oauth2_token_response: null,
        },
      });
      return {
        error: 'INVALID_REFRESH_TOKEN',
      };
    }
    const tokenResponseJson = await tokenResponse.json();
    // Store the token information in the database
    await prismaClient.user.update({
      where: {
        id: BigInt(userId),
      },
      data: {
        oauth2_token_response: JSON.stringify(tokenResponseJson),
      },
    });
    accessToken = tokenResponseJson.access_token;
  }
  return {
    error: undefined,
    accessToken,
  };
}

export async function refreshProfileMetadata(userId: string): Promise<boolean> {
  const userOauth2AccessToken = await getUserOauth2AccessToken(userId);
  if (userOauth2AccessToken.error) {
    return false;
  }
  // Update metadata
  await fetch(`https://discord.com/api/v10/users/@me/applications/${client.application?.id || ''}/role-connection`, {
    method: 'put',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${userOauth2AccessToken.accessToken}`,
    },
    body: JSON.stringify({
      platform_name: 'Bread',
      metadata: {
        totalcount: Number(`${await getGlobalCountForUser(userId)}`),
      },
    }),
  });
  return true;
}
