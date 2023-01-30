import {
  CommandInteractionOptionResolver,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../interfaces.js";
import config from "../config.json" assert { type: "json" };
import { myFetch } from "../utils.js";

interface TwitterUser {
  data: {
    id: string;
    username: string;
  };
}

interface TwitterTweet {
  data: {
    id: string;
  }[];
}

const options = {
  headers: {
    Authorization: `Bearer ${config.twitterBearer}`,
  },
};

const Twitter: Command = {
  data: new SlashCommandBuilder()
    .setName("twitter")
    .setDescription("Show the latest tweet from {user}")
    .addStringOption((option) =>
      option.setName("name").setDescription("Twitter name").setRequired(true)
    ),
  execute: async (interaction) => {
    if (!(interaction.options instanceof CommandInteractionOptionResolver))
      return;

    await interaction.deferReply();

    const twitterUser = await myFetch<TwitterUser>(
      `https://api.twitter.com/2/users/by/username/${interaction.options.getString(
        "name"
      )}`,
      "data",
      options
    );

    if (!twitterUser.data) {
      await interaction.editReply("error");

      return;
    }

    const tweet = await myFetch<TwitterTweet>(
      `https://api.twitter.com/2/users/${twitterUser.data.data.id}/tweets`,
      "data",
      options
    );

    if (!tweet.data) {
      await interaction.editReply("error");

      return;
    }

    await interaction.editReply(
      `https://twitter.com/${twitterUser.data.data.username}/status/${tweet.data.data[0].id}`
    );
  },
};

export default Twitter;
