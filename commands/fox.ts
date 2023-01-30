import { SlashCommandBuilder } from "discord.js";
import { Command } from "../interfaces.js";
import { myFetch } from "../utils.js";

interface FoxData {
  image: string;
}

const Fox: Command = {
  data: new SlashCommandBuilder().setName("fox").setDescription("Cute fox UwU"),
  execute: async (interaction) => {
    const data = await myFetch<FoxData>("https://randomfox.ca/floof/", "image");

    if (!data.data) {
      await interaction.reply(JSON.stringify(data));

      return;
    }

    if (data.data.image) {
      await interaction.reply(data.data.image);
    }
  },
};

export default Fox;
