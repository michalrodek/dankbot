import { Client, Collection, GatewayIntentBits } from "discord.js";
import { Command, Event } from "./interfaces.js";
import { getFiles } from "./utils.js";
import config from "./config.json" assert { type: "json" };

declare module "discord.js" {
  interface Client {
    commands: Collection<string, Command>;
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// Commands
const commandFiles = getFiles("/commands");

for (const file of commandFiles) {
  const { default: command }: { default: Command } = await import(
    `./commands/${file}`
  );

  client.commands.set(command.data.name, command);
}

// Events
const eventFiles = getFiles("/events");

for (const file of eventFiles) {
  const { default: event }: { default: Event } = await import(
    `./events/${file}`
  );

  if (event.once) {
    client.once(event.name, (...args) => {
      event.execute(args);
    });
  } else {
    client.on(event.name, (...args) => {
      event.execute(args);
    });
  }
}

client.login(config.token);
