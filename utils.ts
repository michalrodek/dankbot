import { CommandInteraction } from "discord.js";
import fetch, { RequestInit } from "node-fetch";
import fs from "fs";
import config from "./config.json" assert { type: "json" };
import { fileURLToPath } from "url";
import { dirname } from "path";

interface ApiResponse<T> {
  data?: T;
  message?: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const getEmoji = (interaction: CommandInteraction, id: string) => {
  const emoji = interaction.client.emojis.cache.get(`${BigInt(id)}`);

  return `<:${emoji?.name}:${emoji?.id}>`;
};

function isResponseValid<T>(
  response: unknown,
  propName: string
): response is T {
  if (
    typeof response === "object" &&
    response != null &&
    (propName in response || Array.isArray(response))
  )
    return true;

  return false;
}

export const twitchFetch = async <T>(
  url: string,
  method: "GET" | "POST" | "DELETE",
  body?: string
): Promise<ApiResponse<T>> => {
  let response: unknown;

  try {
    switch (method) {
      case "POST":
        response = await twitchFetchPost(url, body);
        break;
      case "DELETE":
        response = await twitchFetchDelete(url);
        break;
      default:
        response = await twitchFetchGet(url);
        break;
    }

    if (isResponseValid<T>(response, "data")) {
      return { data: response };
    }

    if (
      typeof response === "object" &&
      response != null &&
      "message" in response
    ) {
      if (response.message === "Invalid OAuth token") {
        const config = JSON.parse(
          fs.readFileSync("config.json", { encoding: "utf-8" })
        );

        const data = await refreshAppAccessToken();

        if (!data.data) {
          return { message: "error" };
        }

        config.twitchBearer = data.data.access_token;

        fs.writeFileSync("config.json", JSON.stringify(config));

        response = await (await twitchFetch<T>(url, method, body)).data;
      }

      if (isResponseValid<T>(response, "data")) {
        return { data: response };
      }
    }

    return { message: "error" };
  } catch (error) {
    if (error instanceof Error) {
      return { message: error.message };
    }

    return { message: "error" };
  }
};

const twitchFetchGet = async (url: string) => {
  const config = readConfig();

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.twitchBearer}`,
      "Client-ID": `${config.twitchClientId}`,
    },
  });

  const data = await response.json();

  return data;
};

const twitchFetchPost = async (url: string, body: string | undefined) => {
  const config = readConfig();

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.twitchBearer}`,
      "Client-ID": `${config.twitchClientId}`,
      "Content-Type": "application/json",
    },
    body: body,
  });

  const data = await response.json();

  return data;
};

const twitchFetchDelete = async (url: string) => {
  const config = readConfig();

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${config.twitchBearer}`,
      "Client-ID": `${config.twitchClientId}`,
    },
  });

  const data = await response.json();

  return data;
};

const refreshAppAccessToken = async () => {
  const response = await myFetch<{ access_token: string }>(
    `https://id.twitch.tv/oauth2/token?client_id=${config.twitchClientId}&client_secret=${config.twitchClientSecret}&grant_type=client_credentials`,
    "access_token",
    { method: "POST" }
  );

  return response;
};

export const getFiles = (folder: string) =>
  fs
    .readdirSync(__dirname + folder)
    .filter((file) =>
      file.endsWith(config.env === "development" ? ".ts" : ".js")
    );

export const myFetch = async <T>(
  url: string,
  propName: string,
  options?: RequestInit
): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (isResponseValid<T>(data, propName)) {
      return { data: data };
    }

    return { message: "error" };
  } catch (error) {
    return { message: "error" };
  }
};

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync("config.json", { encoding: "utf-8" }));
  } catch (error) {
    return { message: "error" };
  }
}
