const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('item')
    .setDescription('Lists all users than own an item')
    .addStringOption(option =>
        option.setName('item')
            .setDescription('the item to list owners of')
            .setRequired(true)
            .setAutocomplete(true)
    ),
    async autocomplete({ config, interaction, lootHistory }) {
        const focusedValue = interaction.options.getFocused(true);
        await interaction.respond(lootHistory.DKP.concat(lootHistory.PPP).filter((a, i, arr) => arr.slice(0, i).find(b => b.item == a.item) == null).filter(a => a.item.toLowerCase().includes(focusedValue.value.toLowerCase())).map(a => ({ name: a.item, value: a.item })).sort((a, b) => a.name > b.name ? 1 : -1).slice(0, 25));
    },
    async execute({ config, interaction, lootHistory }) {
        let item = interaction.options.getString('item');
        
        let history = lootHistory.DKP.concat(lootHistory.PPP).filter(a => a.item == item);
        let users = history.map(a => a.user).filter((a, i, arr) => !arr.slice(0, i).includes(a));
        let embed = new EmbedBuilder()
            .setTitle(item)
            .setDescription(users.map(a => `**${a}** x${history.filter(b => b.user == a).length}`).join('\n'))
        await interaction.reply({ ephemeral: true, embeds: [embed] });
    }
}