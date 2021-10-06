 const { Intents, Discord } = require("discord.js");
 const configs = {
 intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_VOICE_STATES ],
  // Partials your bot may need should go here, CHANNEL is required for DM's
  partials: ["CHANNEL"]
 
 
 };
module.exports = configs;
