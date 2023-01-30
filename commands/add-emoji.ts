import {
  CommandInteraction,
  CommandInteractionOptionResolver,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../interfaces.js";
import { getEmoji } from "../utils.js";

const AddEmote: Command = {
  data: new SlashCommandBuilder()
    .setName("add-emoji")
    .setDescription("Add new emoji")
    .addStringOption((option) =>
      option.setName("name").setDescription("name").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("url").setDescription("URL").setRequired(true)
    ),
  execute: async (interaction) => {
    if (!(interaction.options instanceof CommandInteractionOptionResolver))
      return;

    await addEmoji(interaction, "name", "url");

    await interaction.reply(
      `A new emote \`${interaction.options.getString(
        "name"
      )}\` was created ${getEmoji(interaction, "492048993447051288")}`
    );
  },
};

export default AddEmote;

export async function addEmoji(
  interaction: CommandInteraction,
  emojiName: string,
  emojiUrl: string
) {
  if (!(interaction.options instanceof CommandInteractionOptionResolver))
    return;

  const name = interaction.options.getString(emojiName);
  const url = interaction.options.getString(emojiUrl);

  if (!url || !name) return;

  await interaction.guild?.emojis.create({
    attachment: url,
    name: name,
  });
}
