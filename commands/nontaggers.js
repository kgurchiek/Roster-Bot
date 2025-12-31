const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nontaggers'),
    async buttonHandler({ config, interaction, supabase, monsterList, campRules, pointRules }) {
        let args = interaction.customId.split('-');
        let eventId = args[1];

        await interaction.deferReply({ ephemeral: true });
        let { data: event, error } = await supabase.from(config.supabase.tables.events).select('*').eq('event_id', eventId);
        if (error) return await interaction.editReply({ content: '', embeds: [errorEmbed('Error Fetching Event', error.message)] });
        event = event[0];
        if (event == null) return await interaction.editReply({ content: '', embeds: [errorEmbed('Error Fetching Event', `Couldn't find event with id ${eventId}`)] });

        let signups;
        ({ data: signups, error } = await supabase.from(config.supabase.tables.signups).select('*, player_id (id, username)').eq('event_id', eventId));
        if (error) return await interaction.editReply({ content: '', embeds: [errorEmbed('Error Fetching Signups', error.message)] });

        signups = signups.filter((a, i) => !a.tagged && signups.slice(0, i).find(b => b.player_id.id == a.player_id.id) == null);
        const newEmbed = new EmbedBuilder()
            .setTitle(`${event.monster_name} Non-Taggers`)
            .setDescription(`\`\`\`\n${signups.map(a => `${a.player_id.username}`).join('\n')}\n\`\`\``)
        await interaction.editReply({ embeds: [newEmbed] });
    }
}