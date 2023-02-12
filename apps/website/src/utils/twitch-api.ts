import { z } from "zod";
import fetch from "node-fetch";
import {
  ExpiredAccessTokenError,
  getClientCredentialsAccessToken,
} from "./oauth2";
import { env } from "../env/server.mjs";

export type AuthHeaders = {
  "Client-Id": string;
  Authorization: `Bearer ${string}`;
};

let authHeaders: AuthHeaders | null = null;

async function getApplicationAuthHeaders() {
  if (authHeaders !== null) {
    return authHeaders;
  }

  const clientId = env.TWITCH_CLIENT_ID;
  const clientSecret = env.TWITCH_CLIENT_SECRET;

  const accessToken = await getClientCredentialsAccessToken(
    "twitch",
    clientId,
    clientSecret
  );
  if (accessToken === undefined) {
    throw Error("Twitch API: Could not obtain OAuth access token!");
  }

  authHeaders = {
    "Client-Id": clientId,
    Authorization: `Bearer ${accessToken}`,
  };

  return authHeaders;
}

const paginationSchema = z.object({ cursor: z.string().optional() });

const subscriptionsResponseSchema = z.object({
  total: z.number(),
  data: z.array(
    z.object({
      id: z.string(),
      status: z.string(),
      type: z.string(),
      version: z.string(),
      condition: z.object({ broadcaster_user_id: z.string() }),
      created_at: z.string(),
      transport: z.object({
        method: z.string(),
        callback: z.string().optional(),
      }),
      cost: z.number(),
    })
  ),
  max_total_cost: z.number(),
  total_cost: z.number(),
  pagination: paginationSchema,
});

export type StreamsResponse = z.infer<typeof streamsResponseSchema>;

const streamsResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      user_id: z.string(),
      user_login: z.string(),
      user_name: z.string(),
      game_id: z.string(),
      game_name: z.string(),
      type: z.string(),
      title: z.string(),
      viewer_count: z.number(),
      started_at: z.string(),
      language: z.string(),
      thumbnail_url: z.string(),
      tag_ids: z.array(z.string()),
      is_mature: z.boolean(),
    })
  ),
  pagination: paginationSchema,
});

export async function getSubscriptions() {
  const response = await fetch(
    "https://api.twitch.tv/helix/eventsub/subscriptions",
    {
      method: "GET",
      headers: {
        ...(await getApplicationAuthHeaders()),
      },
    }
  );

  if (response.status === 403) {
    throw new ExpiredAccessTokenError();
  }

  const json = await response.json();
  return await subscriptionsResponseSchema.parseAsync(json);
}

export async function removeSubscription(id: string) {
  const response = await fetch(
    `https://api.twitch.tv/helix/eventsub/subscriptions?${new URLSearchParams({
      id,
    })}`,
    {
      method: "DELETE",
      headers: {
        ...(await getApplicationAuthHeaders()),
      },
    }
  );

  if (response.status === 403) {
    throw new ExpiredAccessTokenError();
  }

  // usually 204
  return response.status >= 200 && response.status < 300;
}

export async function createSubscription(
  type: string,
  user_id: string,
  callback: string,
  secret: string
) {
  const response = await fetch(
    `https://api.twitch.tv/helix/eventsub/subscriptions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getApplicationAuthHeaders()),
      },
      body: JSON.stringify({
        type: type,
        version: "1",
        condition: {
          broadcaster_user_id: user_id,
        },
        transport: {
          method: "webhook",
          callback: callback,
          secret: secret,
        },
      }),
    }
  );

  if (response.status === 403) {
    throw new ExpiredAccessTokenError();
  }

  // usually 202 Accepted
  return response.status >= 200 && response.status < 300;
}

export async function getSubscriptionsForUser(userId: string) {
  const response = await fetch(
    `https://api.twitch.tv/helix/eventsub/subscriptions?${new URLSearchParams({
      user_id: userId,
    })}`,
    {
      method: "GET",
      headers: {
        ...(await getApplicationAuthHeaders()),
      },
    }
  );

  if (response.status === 403) {
    throw new ExpiredAccessTokenError();
  }

  const json = await response.json();
  if (response.status !== 200) {
    console.error(json);
    throw new Error("Could not get subscription!");
  }

  return await subscriptionsResponseSchema.parseAsync(json);
}

export async function getStreamsForChannels(channelIds: Array<string>) {
  const response = await fetch(
    `https://api.twitch.tv/helix/streams?${new URLSearchParams([
      ...channelIds.map((id) => ["user_id", id]),
    ])}`,
    {
      method: "GET",
      headers: {
        ...(await getApplicationAuthHeaders()),
      },
    }
  );

  if (response.status === 403) {
    throw new ExpiredAccessTokenError();
  }

  const json = await response.json();
  if (response.status !== 200) {
    console.error(json);
    throw new Error("Could not get streams!");
  }

  return await streamsResponseSchema.parseAsync(json);
}
