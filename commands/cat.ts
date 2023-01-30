import { SlashCommandBuilder } from "discord.js";
import { Command } from "../interfaces.js";
import { myFetch } from "../utils.js";

interface CatData {
  file: string;
}

const Cat: Command = {
  data: new SlashCommandBuilder().setName("cat").setDescription("Cute cat"),
  execute: async (interaction) => {
    const data = await myFetch<CatData>("http://aws.random.cat/meow", "file");

    if (!data.data) {
      await interaction.reply(JSON.stringify(data));

      return;
    }

    if (data.data.file) {
      await interaction.reply(data.data.file);
    }
  },
};

export default Cat;
