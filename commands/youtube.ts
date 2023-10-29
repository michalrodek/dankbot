import {
  CommandInteractionOptionResolver,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../interfaces.js";
import config from "../config.json" assert { type: "json" };
import { myFetch } from "../utils.js";

interface YoutubeData {
  items: {
    id: {
      videoId: string;
    };
  }[];
}

const Youtube: Command = {
  data: new SlashCommandBuilder()
    .setName("youtube")
    .setDescription("Search a YouTube video")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("Name of the video")
        .setRequired(true)
    ),
  execute: async (interaction) => {
    if (!(interaction.options instanceof CommandInteractionOptionResolver))
      return;

    await interaction.deferReply();

    const query = interaction.options.getString("query");
    const data = await myFetch<YoutubeData>(
      `https://www.googleapis.com/youtube/v3/search?part=id&q=${query}&type=video&maxResults=1&key=${config.youtubeToken}`,
      "items"
    );

    if (!data.data) {
      await interaction.reply("error");

      return;
    }

    const url = `https://www.youtube.com/watch?v=${data.data.items[0].id.videoId}`;

    await interaction.editReply(url);
  },
};

export default Youtube;
