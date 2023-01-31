import { SlashCommandBuilder } from "discord.js";
import { Command } from "../interfaces.js";
import { getEmoji, myFetch, twitchFetch } from "../utils.js";

let streamers: string[] = [];
let lastUpdate: Date;

interface TmiResponseWithStreamer {
  data?: TmiResponse;
  streamer: string;
  status: string;
}

interface TmiResponse {
  chatters: Chatters;
}

interface Chatters {
  [key: string]: string[];
  broadcaster: string[];
  vips: string[];
  moderators: string[];
  viewers: string[];
}

interface SearchedUsers {
  [key: string]: string[];
}

interface TwitchStreams {
  data: {
    user_login: string;
  }[];
  pagination: {
    cursor: string;
  };
}

let chatters: TmiResponseWithStreamer[] = [];

const Stalk: Command = {
  data: new SlashCommandBuilder()
    .setName("stalk")
    .setDescription("Definitely not stalking Kapp")
    .addStringOption((option) =>
      option.setName("nick").setDescription("Twitch nick").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("nick2").setDescription("Twitch nick")
    )
    .addStringOption((option) =>
      option.setName("nick3").setDescription("Twitch nick")
    )
    .addStringOption((option) =>
      option.setName("nick4").setDescription("Twitch nick")
    )
    .addStringOption((option) =>
      option.setName("nick5").setDescription("Twitch nick")
    ),
  execute: async (interaction) => {
    await interaction.deferReply();

    if (lastUpdate == null || new Date(Date.now()) > lastUpdate) {
      streamers = [];

      await getOnlineStreams(streamers);

      const result = streamers.map((streamer) => findUserAsync(streamer));
      chatters = await Promise.all(result);

      const dateNow = new Date(Date.now());
      lastUpdate = new Date(dateNow.setMinutes(dateNow.getMinutes() + 5));
    }

    const inputUsers = interaction.options.data.map((user) => {
      if (typeof user.value === "string") {
        return user.value.toLowerCase();
      }
    });

    const searchedUsers: SearchedUsers = {};

    inputUsers.map((user) => {
      if (typeof user === "string") {
        searchedUsers[user] = [];
      }
    });

    const notFetchedStreams: string[] = [];

    chatters.map((resp) => {
      if (resp.status === "fulfilled" && resp.data) {
        const data = resp.data;

        for (const group in data.chatters) {
          data.chatters[group].map((user) => {
            if (inputUsers.includes(user)) {
              searchedUsers[user].push(resp.streamer);
            }
          });
        }
      } else {
        notFetchedStreams.push(resp.streamer);
      }
    });

    let message = "";

    for (const searchedUser in searchedUsers) {
      if (searchedUsers[searchedUser].length === 0) {
        message += `**${searchedUser}** neni nikde ${getEmoji(
          interaction,
          "766995035718680606"
        )}\n`;
      } else {
        message += `**${searchedUser}** je u \`${searchedUsers[searchedUser]}\`\n`;
      }
    }

    if (notFetchedStreams.length > 0) {
      message += `Could not load data for \`${notFetchedStreams}\``;
    }

    await interaction.editReply(message);
  },
};

export default Stalk;

const findUserAsync = async (
  streamer: string
): Promise<TmiResponseWithStreamer> => {
  const data = await myFetch<TmiResponse>(
    `https://tmi.twitch.tv/group/user/${streamer}/chatters`,
    "chatters"
  );

  if (!data.data) {
    return { streamer, status: "rejected" };
  }

  return { data: data.data, streamer, status: "fulfilled" };
};

const getOnlineStreams = async (streamers: string[], cursor?: string) => {
  let url: string;

  if (cursor) {
    url = `https://api.twitch.tv/helix/streams?language=cs&first=100&after=${cursor}`;
  } else {
    url = `https://api.twitch.tv/helix/streams?language=cs&first=100`;
  }

  const data = await twitchFetch<TwitchStreams>(url, "GET");

  if (!data.data) return;

  for (const stream of data.data.data) {
    streamers.push(stream.user_login);
  }

  if (data.data.pagination.cursor) {
    await getOnlineStreams(streamers, data.data.pagination.cursor);
  }
};
