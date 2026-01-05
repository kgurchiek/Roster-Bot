const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonStyle, ButtonBuilder } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset')
        .setDescription('Resets all signups and posts new embeds (staff only)'),
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
            .setDescription('Are you sure you want to reset all active rosters? This will permanently delete all event and signup data.')
        let buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('reset-confirm')
                    .setStyle(ButtonStyle.Success)
                    .setLabel('✓')
            )
        await interaction.reply({ ephemeral: true, embeds: [embed], components: [buttons] });
    },
    async buttonHandler({ config, interaction, user, supabase }) {
        if (!user.staff) {
            let embed = new EmbedBuilder()
                .setTitle('Error')
                .setColor('#ff0000')
                .setDescription(`This action can only be performed by staff`)
            return await interaction.reply({ ephemeral: true, embeds: [embed] });
        }

        await interaction.deferUpdate();
        let { error } = await supabase.from(config.supabase.tables.signups).delete().gt('event_id', -1);
        if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error deleting signups', error.message)], components: [] });

        ({ error } = await supabase.from(config.supabase.tables.events).delete().gt('event_id', -1));
        if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error deleting event', error.message)], components: [] });

        let embed = new EmbedBuilder()
            .setTitle('Success')
            .setColor('#00ff00')
            .setDescription('Event and signup data deleted. Restarting bot...')
        await interaction.editReply({ ephemeral: true, embeds: [embed], components: [] });
        process.exit();
    }
}