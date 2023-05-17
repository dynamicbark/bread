import { Request, Response } from 'express';
import { client } from '../../index.js';

export async function authStartRoute(req: Request, res: Response) {
  const redirectUrl = new URL('https://discord.com/api/oauth2/authorize');
  const components = {
    client_id: client.application?.id || '',
    redirect_uri: `${process.env.DISCORD_OAUTH2_BASE_URI}/auth/callback`,
    response_type: 'code',
    scope: 'identify role_connections.write',
  };
  for (let [key, val] of Object.entries(components)) {
    redirectUrl.searchParams.append(key, val);
  }
  res.redirect(redirectUrl.toString());
}
