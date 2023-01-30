import { SlashCommandBuilder } from "discord.js";
import { Command } from "../interfaces.js";
import { myFetch } from "../utils.js";

interface DogData {
  url: string;
}

const Dog: Command = {
  data: new SlashCommandBuilder().setName("dog").setDescription("Cute doggo"),
  execute: async (interaction) => {
    const data = await myFetch<DogData>("https://random.dog/woof.json", "url");

    if (!data.data) {
      await interaction.reply(JSON.stringify(data));

      return;
    }

    if (data.data.url) {
      await interaction.reply(data.data.url);
    }
  },
};

export default Dog;
