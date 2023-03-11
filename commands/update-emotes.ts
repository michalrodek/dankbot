import fs from "fs";
import { getEmoji, myFetch, twitchFetch } from "../utils.js";
import { SlashCommandBuilder } from "discord.js";
import { Command } from "../interfaces.js";
import config from "../config.json" assert { type: "json" };

interface TwitchEmotes {
  data: {
    name: string;
    images: {
      url_4x: string;
    };
  }[];
}

interface SevenTvEmotes {
  name: string;
  urls: string[][];
}

interface FfzEmotes {
  room: {
    set: number;
  };
  sets: {
    [key: number]: {
      emoticons: {
        name: string;
        urls: {
          4: string;
        };
      }[];
    };
  };
}

interface BttvEmote {
  code: string;
  id: number;
}

interface BttvUser {
  channelEmotes: BttvEmote[];
  sharedEmotes: BttvEmote[];
}

const UpdateEmotes: Command = {
  data: new SlashCommandBuilder()
    .setName("update-emotes")
    .setDescription("Update BetterDiscord emotes"),
  execute: async (interaction) => {
    await interaction.deferReply();

    const emotes: { [key: string]: string } = {};
    const streamIds = [
      186352304, 605904906, 102440358, 118291244, 222685529, 22484632,
    ];

    // Twitch Global Emotes
    const twitchEmotes = await twitchFetch<TwitchEmotes>(
      "https://api.twitch.tv/helix/chat/emotes/global",
      "GET"
    );

    if (twitchEmotes.data) {
      for (const emote of twitchEmotes.data.data) {
        emotes[emote.name] = emote.images.url_4x;
      }
    }

    // BTTV Global Emotes
    const bttvGlobalEmotes = await myFetch<BttvEmote[]>(
      "https://api.betterttv.net/3/cached/emotes/global",
      ""
    );

    if (bttvGlobalEmotes.data) {
      for (const emote of bttvGlobalEmotes.data) {
        emotes[emote.code] = `https://cdn.betterttv.net/emote/${emote.id}/3x`;
      }
    }

    // 7TV Global Emotes
    const sevenTvEmotes = await myFetch<SevenTvEmotes[]>(
      "https://api.7tv.app/v2/emotes/global",
      "name"
    );

    if (sevenTvEmotes.data) {
      for (const emote of sevenTvEmotes.data) {
        emotes[emote.name] = emote.urls[3][1];
      }
    }

    for (const streamId of streamIds) {
      // Twitch Sub Emotes
      const twitchSubEmotes = await twitchFetch<TwitchEmotes>(
        `https://api.twitch.tv/helix/chat/emotes?broadcaster_id=${streamId}`,
        "GET"
      );

      if (twitchSubEmotes.data) {
        for (const emote of twitchSubEmotes.data.data) {
          const urlWithAnimation = emote.images.url_4x.replace(
            "/static/",
            "/default/"
          );
          emotes[emote.name] = urlWithAnimation;
        }
      }

      // FFZ Channel Emotes
      const ffzEmotes = await myFetch<FfzEmotes>(
        `https://api.frankerfacez.com/v1/room/id/${streamId}`,
        "room"
      );

      if (ffzEmotes.data) {
        if (ffzEmotes.data.sets) {
          for (const emote of ffzEmotes.data.sets[ffzEmotes.data.room.set]
            .emoticons) {
            emotes[emote.name] = emote.urls[4];
          }
        }
      }

      // BTTV Channel Emotes
      const bttvEmotes = await myFetch<BttvUser>(
        `https://api.betterttv.net/3/cached/users/twitch/${streamId}`,
        "channelEmotes"
      );

      if (bttvEmotes.data) {
        for (const emote of bttvEmotes.data.channelEmotes) {
          emotes[emote.code] = `https://cdn.betterttv.net/emote/${emote.id}/3x`;
        }

        for (const emote of bttvEmotes.data.sharedEmotes) {
          emotes[emote.code] = `https://cdn.betterttv.net/emote/${emote.id}/3x`;
        }
      }

      // 7TV Channel Emotes
      const sevenTvEmotes = await myFetch<SevenTvEmotes[]>(
        `https://api.7tv.app/v2/users/${streamId}/emotes`,
        "name"
      );

      if (sevenTvEmotes.data) {
        for (const emote of sevenTvEmotes.data) {
          emotes[emote.name] = emote.urls[3][1];
        }
      }
    }

    fs.writeFileSync(config.emotesFile, JSON.stringify({ MyEmotes: emotes }));

    await interaction.editReply(
      `Emotes have beed updated ${getEmoji(interaction, "492048993447051288")}`
    );
  },
};

export default UpdateEmotes;
