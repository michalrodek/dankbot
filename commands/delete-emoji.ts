import {
  CommandInteraction,
  CommandInteractionOptionResolver,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../interfaces.js";

const DeleteEmote: Command = {
  data: new SlashCommandBuilder()
    .setName("delete-emote")
    .setDescription("Delete emoji")
    .addStringOption((option) =>
      option.setName("name").setDescription("name").setRequired(true)
    ),
  execute: async (interaction) => {
    if (!(interaction.options instanceof CommandInteractionOptionResolver))
      return;

    await deleteEmoji(interaction, "name");

    await interaction.reply("Emoji deleted.");
  },
};

export default DeleteEmote;

export async function deleteEmoji(
  interaction: CommandInteraction,
  emojiName: string
) {
  if (!(interaction.options instanceof CommandInteractionOptionResolver))
    return;

  const name = interaction.options
    .getString(emojiName)
    ?.split(":")[2]
    .slice(0, -1);

  if (!name) return;

  const emoji = await interaction.guild?.emojis.fetch(name);

  await emoji?.delete();
}
