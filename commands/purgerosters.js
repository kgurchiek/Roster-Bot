const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonStyle, ButtonBuilder } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purgerosters')
        .setDescription('Deletes all roster embeds (staff only)'),
    async execute({ config, interaction, user }) {
        if (!user.staff) {
            let embed = new EmbedBuilder()
                .setTitle('Error')
                .setColor('#ff0000')
                .setDescription(`This action can only be performed by staff`)
            return await interaction.reply({ ephemeral: true, embeds: [embed] });
        }

        let embed = new EmbedBuilder()
            .setTitle('Warning')
            .setColor('#ffff00')
            .setDescription('Are you sure you want to delete all roster embeds?.')
        let buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('purgerosters-confirm')
                    .setStyle(ButtonStyle.Success)
                    .setLabel('✓')
            )
        await interaction.reply({ ephemeral: true, embeds: [embed], components: [buttons] });
    },
    async buttonHandler({ config, interaction, user, rosterChannels, client }) {
        if (!user.staff) {
            let embed = new EmbedBuilder()
                .setTitle('Error')
                .setColor('#ff0000')
                .setDescription(`This action can only be performed by staff`)
            return await interaction.reply({ ephemeral: true, embeds: [embed] });
        }

        await interaction.deferUpdate({ ephemeral: true });
        let threads = {
            DKP: Array.from((await rosterChannels.DKP.threads.fetchActive(false)).threads.values()).concat(Array.from((await rosterChannels.DKP.threads.fetchArchived(false)).threads.values())),
            PPP: Array.from((await rosterChannels.PPP.threads.fetchActive(false)).threads.values()).concat(Array.from((await rosterChannels.PPP.threads.fetchArchived(false)).threads.values()))
        }
        for (let thread of threads.DKP.concat(threads.PPP)) {
            let embed = new EmbedBuilder()
                .setDescription(`Deleting ${thread.name} embeds...`)
            await interaction.editReply({ embeds: [embed], components: [] });
            let messages = Array.from((await thread.messages.fetch({ limit: 100, cache: false })).values()).filter(a => a.author.id == client.user.id);
            await Promise.all(messages.map(a => a.delete()));
        }

        let embed = new EmbedBuilder()
            .setTitle('Success')
            .setColor('#00ff00')
            .setDescription('Roster embeds have been purged.')
        await interaction.editReply({ embeds: [embed], components: [] });
    }
}