import { REST, Routes } from "discord.js";
import config from "./config.json" assert { type: "json" };

const rest = new REST({ version: "10" }).setToken(config.token);

if (config.env === "production") {
  await rest.put(Routes.applicationCommands(config.appId), {
    body: [],
  });
} else {
  await rest.put(
    Routes.applicationGuildCommands(config.appId, config.guild_id),
    {
      body: [],
    }
  );
}
