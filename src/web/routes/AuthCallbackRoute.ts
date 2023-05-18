import { Request, Response } from 'express';
import { client, prismaClient } from '../../index.js';
import { refreshProfileMetadata } from '../../utils/DiscordUtils.js';
import { userQueueItemProcess } from '../../utils/QueueUtils.js';

export async function authCallbackRoute(req: Request, res: Response) {
  if (!req.query.code) {
    return res.status(400).json({
      error: 'BAD_REQUEST',
    });
  }
  const code = req.query.code as string;
  // Send a request to Discord to get the auth token
  const reqBodyParams: Record<string, string> = {
    client_id: client.application?.id || '',
    client_secret: process.env.DISCORD_CLIENT_SECRET || '',
    grant_type: 'authorization_code',
    code,
    redirect_uri: `${process.env.DISCORD_OAUTH2_BASE_URI}/auth/callback`,
    scope: 'identify role_connections.write',
  };
  const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
    method: 'post',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(reqBodyParams),
  });
  // If the response isn't a 200 status code, assume the code is invalid
  if (tokenResponse.status !== 200) {
    return res.status(400).json({
      error: 'INVALID_CODE',
    });
  }
  const tokenResponseJson = await tokenResponse.json();
  // Get the user id (since otherwise, we aren't sure what user it is)
  const usersMeResponse = await fetch('https://discord.com/api/users/@me', {
    headers: {
      authorization: `${tokenResponseJson.token_type} ${tokenResponseJson.access_token}`,
    },
  });
  const usersMeResponseJson = await usersMeResponse.json();
  // Make sure the user is in the database before doing the oauth2 callback
  await new Promise<void>((resolve) => {
    userQueueItemProcess(
      {
        userId: usersMeResponseJson.id,
        username: usersMeResponseJson.username,
        discriminator: usersMeResponseJson.discriminator,
      },
      () => {
        resolve();
      }
    );
  });
  // Store the token information in the database
  await prismaClient.user.update({
    where: {
      id: BigInt(usersMeResponseJson.id),
    },
    data: {
      oauth2_token_response: JSON.stringify(tokenResponseJson),
    },
  });
  // Attempt to refresh the profile metadata
  await refreshProfileMetadata(usersMeResponseJson.id);
  // Send back a message to the user letting them know the authorization was successful
  res.status(200).type('text/plain').send('Authorized. You can return to Discord now.');
}
