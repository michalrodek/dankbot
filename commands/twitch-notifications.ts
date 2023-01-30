import {
  ActionRowBuilder,
  CommandInteractionOptionResolver,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { twitchFetch } from "../utils.js";
import { Command, TwitchSubs, TwitchUser } from "../interfaces.js";

const TwitchNotifications: Command = {
  data: new SlashCommandBuilder()
    .setName("twitch-notifications")
    .setDescription("Twitch notification settings")
    .addStringOption((option) =>
      option.setName("name").setDescription("streamer name").setRequired(true)
    ),
  execute: async (interaction) => {
    if (!(interaction.options instanceof CommandInteractionOptionResolver))
      return;

    const user = await twitchFetch<TwitchUser>(
      `https://api.twitch.tv/helix/users?login=${interaction.options.getString(
        "name"
      )}`,
      "GET"
    );

    const subs = await twitchFetch<TwitchSubs>(
      "https://api.twitch.tv/helix/eventsub/subscriptions",
      "GET"
    );

    if (!subs.data) {
      await interaction.reply("error");

      return;
    }

    const filteredSubs = subs.data.data.filter(
      (sub) => sub.condition.broadcaster_user_id === user.data?.data[0].id
    );

    const onlineSub = filteredSubs.find((sub) => sub.type === "stream.online");
    const offlineSub = filteredSubs.find(
      (sub) => sub.type === "stream.offline"
    );
    const updateSub = filteredSubs.find((sub) => sub.type === "channel.update");

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(interaction.options.getString("name")!)
        .setMinValues(0)
        .setMaxValues(3)
        .addOptions(
          {
            label: "Online",
            description: "Online notifications",
            value: "online",
            default: Boolean(onlineSub),
          },
          {
            label: "Offline",
            description: "Offline notifications",
            value: "offline",
            default: Boolean(offlineSub),
          },
          {
            label: "Update",
            description: "Update notifications",
            value: "update",
            default: Boolean(updateSub),
          }
        )
    );

    await interaction.reply({ components: [row] });
  },
};

export default TwitchNotifications;
