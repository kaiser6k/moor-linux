import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ChannelType,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const ICON = join(ROOT, "public/brand/icon-discord.png");
const BMC = "https://www.buymeacoffee.com/y6QUkvf";
const GITHUB = "https://github.com/kaiser6k/moor-linux";

function loadEnv() {
  for (const file of [join(HERE, ".env"), join(ROOT, ".env")]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 1) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!process.env[k]) process.env[k] = v;
    }
  }
}
loadEnv();

const TOKEN = process.env.DISCORD_TOKEN?.trim();
const CLIENT_ID = process.env.DISCORD_CLIENT_ID?.trim();
const GUILD_ID = process.env.DISCORD_GUILD_ID?.trim();
const ADMIN_SECRET = process.env.ADMIN_SECRET?.trim();
const ADMIN_PORT = Number(process.env.ADMIN_PORT || 8787);

const COMMANDS = [
  new SlashCommandBuilder()
    .setName("moor-setup")
    .setDescription("Brand this server as Moor: icon, channels, Docked role, welcome post")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),
  new SlashCommandBuilder()
    .setName("moor-announce")
    .setDescription("Post a message as the Moor bot")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((o) => o.setName("message").setDescription("What to say").setRequired(true))
    .addChannelOption((o) => o.setName("channel").setDescription("Where (default: this channel)"))
    .toJSON(),
  new SlashCommandBuilder()
    .setName("moor-status")
    .setDescription("Show guild, channels, and Docked role")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),
];

function requireEnv() {
  if (!TOKEN || !CLIENT_ID) {
    console.error("Set DISCORD_TOKEN and DISCORD_CLIENT_ID (see discord/env.example).");
    process.exit(1);
  }
}

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  if (GUILD_ID) {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: COMMANDS });
    console.log(`Registered guild commands on ${GUILD_ID}`);
  } else {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: COMMANDS });
    console.log("Registered global commands (can take up to an hour).");
  }
}

function welcomeEmbed() {
  return new EmbedBuilder()
    .setColor(0x5ee0c4)
    .setTitle("Moor")
    .setDescription(
      "Linux, when the iPhone hits a display.\n\nPlug USB-C into a monitor, add Moor to the Home Screen, start a session.",
    )
    .addFields(
      { name: "Source", value: GITHUB },
      { name: "Coffee", value: BMC },
    )
    .setFooter({ text: "MIT · free for everyone" });
}

function inviteUrl() {
  return `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&permissions=8&integration_type=0&scope=bot%20applications.commands`;
}

async function resolveGuild(client, guildId) {
  if (!guildId) throw new Error("Run this in a server channel, not a DM.");
  try {
    const guild = await client.guilds.fetch(guildId);
    await Promise.all([guild.channels.fetch(), guild.roles.fetch()]);
    return guild;
  } catch {
    throw new Error(`The bot is not in this server. Open this invite (bot + Administrator):\n${inviteUrl()}`);
  }
}

async function ensureRole(guild) {
  let role = guild.roles.cache.find((r) => r.name === "Docked");
  if (!role) {
    role = await guild.roles.create({
      name: "Docked",
      color: 0x5ee0c4,
      mentionable: true,
      reason: "Moor supporters",
    });
  }
  return role;
}

async function ensureChannel(guild, name, topic) {
  const existing = guild.channels.cache.find((c) => c.name === name && c.type === ChannelType.GuildText);
  if (existing) return existing;
  return guild.channels.create({
    name,
    type: ChannelType.GuildText,
    topic,
    reason: "Moor setup",
  });
}

async function setupGuild(guild) {
  if (!guild) throw new Error(`The bot is not in this server. Invite:\n${inviteUrl()}`);
  if (!existsSync(ICON)) throw new Error(`Missing icon at ${ICON}`);
  const icon = readFileSync(ICON);
  await guild.setIcon(icon, "Moor mark");
  if (guild.name !== "Moor") await guild.setName("Moor", "Moor setup");
  const role = await ensureRole(guild);
  const welcome = await ensureChannel(guild, "welcome", "Start here");
  await ensureChannel(guild, "general", "Chat");
  await ensureChannel(guild, "support", "Docking, Save to phone, bugs");
  await ensureChannel(guild, "showcase", "Screenshots of a docked session");
  const recent = await welcome.messages.fetch({ limit: 20 });
  const already = recent.some((m) => m.author.id === guild.client.user.id && m.embeds[0]?.title === "Moor");
  if (!already) await welcome.send({ embeds: [welcomeEmbed()] });
  return {
    guild: guild.name,
    id: guild.id,
    role: role.id,
    welcome: welcome.id,
  };
}

function statusPayload(guild) {
  const channels = [...guild.channels.cache.values()]
    .filter((c) => c.type === ChannelType.GuildText)
    .map((c) => `#${c.name}`)
    .sort();
  const roles = [...guild.roles.cache.values()].map((r) => r.name).filter((n) => n !== "@everyone");
  return { name: guild.name, id: guild.id, channels, roles };
}

function json(res, code, body) {
  const data = JSON.stringify(body);
  res.writeHead(code, { "content-type": "application/json", "content-length": Buffer.byteLength(data) });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("invalid json"));
      }
    });
    req.on("error", reject);
  });
}

function startAdmin(client) {
  if (!ADMIN_SECRET) {
    console.log("ADMIN_SECRET unset — HTTP admin off. Slash commands still work.");
    return;
  }
  const server = createServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://127.0.0.1`);
    const auth = req.headers.authorization || "";
    if (url.pathname === "/health") return json(res, 200, { ok: true });
    if (auth !== `Bearer ${ADMIN_SECRET}`) return json(res, 401, { error: "unauthorized" });
    const guild = GUILD_ID ? await client.guilds.fetch(GUILD_ID).catch(() => null) : client.guilds.cache.first();
    if (!guild) return json(res, 404, { error: "guild not connected — invite the bot first" });
    try {
      if (req.method === "GET" && url.pathname === "/guild") return json(res, 200, statusPayload(guild));
      if (req.method === "POST" && url.pathname === "/setup") return json(res, 200, await setupGuild(guild));
      if (req.method === "POST" && url.pathname === "/announce") {
        const body = await readBody(req);
        const content = String(body.message || "").trim();
        if (!content) return json(res, 400, { error: "message required" });
        const name = String(body.channel || "general").replace(/^#/, "");
        const channel =
          guild.channels.cache.find((c) => c.name === name && c.isTextBased()) ||
          guild.channels.cache.find((c) => c.name === "general" && c.isTextBased());
        if (!channel?.isTextBased()) return json(res, 404, { error: "no text channel" });
        const sent = await channel.send({ content });
        return json(res, 200, { id: sent.id, channel: channel.name });
      }
      json(res, 404, { error: "not found" });
    } catch (err) {
      json(res, 500, { error: err instanceof Error ? err.message : "failed" });
    }
  });
  server.listen(ADMIN_PORT, "0.0.0.0", () => {
    console.log(`Admin API on :${ADMIN_PORT}  (Authorization: Bearer ADMIN_SECRET)`);
  });
}

async function main() {
  requireEnv();
  if (process.argv.includes("--register-only")) {
    await registerCommands();
    return;
  }

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  client.once("ready", async () => {
    console.log(`Logged in as ${client.user.tag}`);
    await registerCommands();
    startAdmin(client);
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ content: "Administrator only.", ephemeral: true });
      return;
    }
    try {
      if (interaction.commandName === "moor-setup") {
        await interaction.deferReply({ ephemeral: true });
        const guild = await resolveGuild(interaction.client, interaction.guildId);
        const result = await setupGuild(guild);
        await interaction.editReply(`Setup done. Welcome is <#${result.welcome}>. Role: <@&${result.role}>`);
      } else if (interaction.commandName === "moor-announce") {
        const guild = await resolveGuild(interaction.client, interaction.guildId);
        const message = interaction.options.getString("message", true);
        const picked = interaction.options.getChannel("channel");
        const channel =
          (picked && "send" in picked ? picked : null) ??
          guild.channels.cache.find((c) => c.id === interaction.channelId && c.isTextBased()) ??
          guild.channels.cache.find((c) => c.name === "general" && c.isTextBased());
        if (!channel || !("send" in channel)) {
          await interaction.reply({ content: "Pick a text channel.", ephemeral: true });
          return;
        }
        await channel.send({ content: message });
        await interaction.reply({ content: `Posted in ${channel}`, ephemeral: true });
      } else if (interaction.commandName === "moor-status") {
        const guild = await resolveGuild(interaction.client, interaction.guildId);
        const info = statusPayload(guild);
        await interaction.reply({
          content: `**${info.name}**\nChannels: ${info.channels.join(" ")}\nRoles: ${info.roles.join(", ")}`,
          ephemeral: true,
        });
      }
    } catch (err) {
      const text = err instanceof Error ? err.message : "failed";
      if (interaction.deferred) await interaction.editReply(text);
      else await interaction.reply({ content: text, ephemeral: true });
    }
  });

  await client.login(TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
