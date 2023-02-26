import {
  ActionRowBuilder,
  BaseInteraction,
  Events,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
} from "discord.js";
import { TwitchSubs, TwitchUser } from "../interfaces.js";
import { twitchFetch } from "../utils.js";
import config from "../config.json" assert { type: "json" };

const InteractionCreate = {
  name: Events.InteractionCreate,
  once: false,
  execute: async (args: unknown[]) => {
    const interaction = args[0];

    if (!(interaction instanceof BaseInteraction)) return;

    if (interaction.isStringSelectMenu()) {
      await handleSelectMenu(interaction);

      return;
    }

    if (!interaction.isChatInputCommand()) return;

    interaction.client.commands
      .get(interaction.commandName)
      ?.execute(interaction, interaction.client);
  },
};

export default InteractionCreate;

async function handleSelectMenu(interaction: StringSelectMenuInteraction) {
  const user = await twitchFetch<TwitchUser>(
    `https://api.twitch.tv/helix/users?login=${interaction.customId}`,
    "GET"
  );

  if (!user.data) {
    return;
  }

  const subs = await twitchFetch<TwitchSubs>(
    "https://api.twitch.tv/helix/eventsub/subscriptions",
    "GET"
  );

  if (!subs.data) {
    return;
  }

  const webhookUrl = "https://api.twitch.tv/helix/eventsub/subscriptions";

  const webhook = {
    version: "1",
    condition: {
      broadcaster_user_id: user.data.data[0].id,
    },
    transport: {
      method: "webhook",
      callback: config.callback,
      secret: config.callbackSecret,
    },
  };

  interaction.values.forEach(async (value) => {
    if (!user.data) return;

    switch (value) {
      case "online":
        await twitchFetch(
          webhookUrl,
          "POST",
          JSON.stringify({
            ...webhook,
            type: "stream.online",
          })
        );
        break;
      case "offline":
        await twitchFetch(
          webhookUrl,
          "POST",
          JSON.stringify({
            ...webhook,
            type: "stream.offline",
          })
        );
        break;
      case "update":
        await twitchFetch(
          webhookUrl,
          "POST",
          JSON.stringify({
            ...webhook,
            type: "channel.update",
          })
        );
        break;
      default:
        break;
    }
  });

  const streamer = subs.data.data.filter(
    (sub) => sub.condition.broadcaster_user_id === user.data?.data[0].id
  );

  const onlineSub = streamer.find((sub) => sub.type === "stream.online");

  if (!interaction.values.includes("online")) {
    await twitchFetch(
      `https://api.twitch.tv/helix/eventsub/subscriptions?id=${onlineSub?.id}`,
      "DELETE"
    );
  }

  const offlineSub = streamer.find((sub) => sub.type === "stream.offline");

  if (!interaction.values.includes("offline")) {
    await twitchFetch(
      `https://api.twitch.tv/helix/eventsub/subscriptions?id=${offlineSub?.id}`,
      "DELETE"
    );
  }

  const updateSub = streamer.find((sub) => sub.type === "channel.update");

  if (!interaction.values.includes("update")) {
    await twitchFetch(
      `https://api.twitch.tv/helix/eventsub/subscriptions?id=${updateSub?.id}`,
      "DELETE"
    );
  }

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(interaction.customId)
      .setMinValues(0)
      .setMaxValues(3)
      .addOptions(
        {
          label: "Online",
          description: "Online notifikace",
          value: "online",
          default: interaction.values.includes("online"),
        },
        {
          label: "Offline",
          description: "Offline notifikace",
          value: "offline",
          default: interaction.values.includes("offline"),
        },
        {
          label: "Update",
          description: "Update notifikace",
          value: "update",
          default: interaction.values.includes("update"),
        }
      )
  );

  await interaction.update({ components: [row] });
}
