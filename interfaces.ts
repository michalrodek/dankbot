import Discord, { CommandInteraction, SlashCommandBuilder } from "discord.js";

export interface Command {
  data:
    | SlashCommandBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (interaction: CommandInteraction, client: Discord.Client) => void;
}

export interface Event {
  name: string;
  once: boolean;
  execute: (args: unknown) => void;
}

export interface TwitchUser {
  data: {
    id: string;
  }[];
}

export interface TwitchSubs {
  data: {
    id: string;
    type: string;
    condition: { broadcaster_user_id: string };
  }[];
}
