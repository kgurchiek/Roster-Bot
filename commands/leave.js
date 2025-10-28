const { SlashCommandBuilder, EmbedBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bid')
}