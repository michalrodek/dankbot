import {
  SlashCommandBuilder,
  CommandInteractionOptionResolver,
} from "discord.js";
import { Command } from "../interfaces.js";
import { addEmoji } from "./add-emoji.js";
import { deleteEmoji } from "./delete-emoji.js";

const ReplaceEmoji: Command = {
  data: new SlashCommandBuilder()
    .setName("replace-emoji")
    .setDescription("Replace emoji with a new one")
    .addStringOption((option) =>
      option
        .setName("old-name")
        .setDescription("Old emoji name")
        .setRequired(true)
    )

    .addStringOption((option) =>
      option
        .setName("new-name")
        .setDescription("New emoji name")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("new-url")
        .setDescription("New emoji URL")
        .setRequired(true)
    ),
  execute: async (interaction) => {
    if (!(interaction.options instanceof CommandInteractionOptionResolver))
      return;

    const oldEmojiName = interaction.options.getString("old-name");
    const newEmojiName = interaction.options.getString("new-name");
    const newEmojiUrl = interaction.options.getString("new-url");

    if (!oldEmojiName || !newEmojiName || !newEmojiUrl) return;

    await deleteEmoji(interaction, "old-name");
    await addEmoji(interaction, "new-name", "new-url");

    await interaction.reply(`Emoji was replaced`);
  },
};

export default ReplaceEmoji;
