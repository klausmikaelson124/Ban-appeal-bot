require('dotenv').config(); // Load environment variables from .env file
const { Client, GatewayIntentBits } = require('discord.js');

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1); // Exit the process after an uncaught exception
});

// Load environment variables
const token = process.env.TOKEN;
const logChannelID = process.env.LOG_CHANNEL_ID;
const statusUpdateChannelID = process.env.STATUS_UPDATE_CHANNEL_ID;
const serverInviteLink = process.env.SERVER_INVITE_LINK;

if (!token || !logChannelID || !statusUpdateChannelID || !serverInviteLink) {
  console.error('One or more required environment variables are missing. Please check the .env file.');
  process.exit(1);
}

// Create a new Client instance with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Utility function to log messages in the log channel
async function logMessage(guild, message) {
  const logChannel = guild.channels.cache.get(logChannelID);
  if (logChannel) {
    try {
      await logChannel.send(message);
    } catch (error) {
      console.error('Failed to send message to log channel:', error);
    }
  } else {
    console.log('Log channel not found. Please verify the LOG_CHANNEL_ID in the .env file.');
  }
}

// Utility function to send a DM and handle errors
async function sendDM(user, content) {
  try {
    await user.send(content);
    console.log(`DM sent to ${user.tag}.`);
  } catch (error) {
    if (error.code === 50007) {
      console.error(`Failed to send DM to ${user.tag}: The user has DMs disabled or does not share a server.`);
    } else {
      console.error(`Unexpected error while sending DM to ${user.tag}:`, error);
    }
  }
}

// Handle commands
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Handle !ban command
  if (message.content.startsWith('!ban') && message.member.permissions.has('BanMembers')) {
    const user = message.mentions.users.first();

    if (!user) {
      return message.reply('Please mention a user to ban.');
    }

    try {
      await message.guild.members.ban(user);

      // Send a DM to the banned user
      await sendDM(
        user,
        `You have been banned from the server. If you wish to appeal the ban, please use the link below to join the **Ban Appeal Server** and submit your appeal:\n\n${serverInviteLink}`
      );

      // Log the ban in the log channel
      await logMessage(message.guild, `${user.tag} has been banned from the server.`);
      message.reply(`${user.tag} has been banned.`);
    } catch (banError) {
      console.error('Error banning user:', banError);
      message.reply('There was an error banning the user. Please try again.');
    }
  }

  // Handle !unban command
  if (message.content.startsWith('!unban') && message.member.permissions.has('BanMembers')) {
    const args = message.content.split(' ').slice(1);
    const userId = args[0];

    if (!userId) {
      return message.reply('Please provide the ID of the user to unban.');
    }

    try {
      await message.guild.members.unban(userId);
      await logMessage(message.guild, `User with ID ${userId} has been unbanned from the server.`);
      message.reply(`User with ID ${userId} has been unbanned.`);
    } catch (unbanError) {
      console.error('Error unbanning user:', unbanError);
      message.reply('There was an error unbanning the user. Please try again.');
    }
  }
});

// Guild ban event
client.on('guildBanAdd', async (ban) => {
  const { guild, user } = ban;

  // Attempt to DM the banned user
  await sendDM(
    user,
    `You have been banned from the server. If you wish to appeal the ban, please use the link below to join the **Ban Appeal Server** and submit your appeal:\n\n${serverInviteLink}`
  );

  // Log the ban in the log channel
  await logMessage(guild, `${user.tag} has been banned from the server.`);
});

// Bot ready event
client.on('ready', async () => {
  console.log(`Bot logged in as ${client.user.tag}`);

  // Send a status update message
  const statusUpdateChannel = client.channels.cache.get(statusUpdateChannelID);
  if (statusUpdateChannel) {
    try {
      await statusUpdateChannel.send('The bot is now **ONLINE** and ready to serve!');
    } catch (error) {
      console.error('Failed to send status update message:', error);
    }
  } else {
    console.log('Status update channel not found. Please verify the STATUS_UPDATE_CHANNEL_ID in the .env file.');
  }

  // Log message in the log channel
  const logChannel = client.channels.cache.get(logChannelID);
  if (logChannel) {
    try {
      await logChannel.send('The bot has successfully logged in and is now online!');
    } catch (error) {
      console.error('Failed to send log message:', error);
    }
  } else {
    console.log('Log channel not found. Please verify the LOG_CHANNEL_ID in the .env file.');
  }
});

// Login the bot
client.login(token).catch((error) => {
  console.error('Failed to log in:', error);
});
