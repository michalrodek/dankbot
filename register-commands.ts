import { REST, Routes, SlashCommandBuilder } from "discord.js";
import config from "./config.json" assert { type: "json" };
import fs from "node:fs";

const rest = new REST({ version: "10" }).setToken(config.token);

const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".ts"));

const commandsPromises = commandFiles.map(
  (file) => import(`./commands/${file}`)
);
const commands = await Promise.all(commandsPromises);

const commandData = commands.map((command) =>
  (command.default.data as SlashCommandBuilder).toJSON()
);

if (config.env === "production") {
  await rest.put(Routes.applicationCommands(config.appId), {
    body: commandData,
  });
} else {
  await rest.put(
    Routes.applicationGuildCommands(config.appId, config.guild_id),
    {
      body: commandData,
    }
  );
}
