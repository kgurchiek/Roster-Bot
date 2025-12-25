const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkuser')
    .setDescription('Gets information about a user')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('the user to get information about')
    ),
    async execute({ config, interaction, supabase, tagList }) {
        await interaction.deferReply({ ephemeral: true });
        const user = (interaction.options.getUser('user') || interaction.user);
        
        let { data: account, error } = await supabase.from(config.supabase.tables.users).select('*').eq('id', user.id).limit(1);
        if (error) return await interaction.editReply({ content: '', embeds: [errorEmbed('Error Fetching User', error.message)] });
        account = account[0];
        if (account == null) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .addFields({ name: 'Error', value: `<@${user.id}> has not registered.` });
            await interaction.editReply({ embeds: [errorEmbed] });
            return;
        }

        let events;
        ({ data: events, error } = await supabase.from(config.supabase.tables.events).select('*')); // TODO: past month only
        if (error) return await interaction.editReply({ content: '', embeds: [errorEmbed('Error Fetching Events', error.message)] });

        let signups;
        ({ data: signups, error } = await supabase.from(config.supabase.tables.signups).select('*, event_id (event_id, monster_name)')); // TODO: past month only
        if (error) return await interaction.editReply({ content: '', embeds: [errorEmbed('Error Fetching Signups', error.message)] });
        signups = signups.filter((a, i) => signups.slice(0, i).find(b => b.event_id.event_id == a.event_id.event_id && b.player_id == a.player_id) == null);

        const newEmbed = new EmbedBuilder()
            .setTitle(account.username)
            .setDescription(`**DKP:** ${account.dkp}
                **PPP:** ${account.ppp}
                **Frozen:** ${account.frozen}${account.last_camped == null ? '' : `\n**Last Camp**:<t:${Math.floor(new Date(account.last_camped).getTime() / 1000)}:R>`}
                **Tag Rates:**${config.supabase.trackedRates.map(a => `\n${a}: ${tagList.filter(b => b.monster_name == a && b.player_id == account.id).length}/${tagList.filter(b => b.monster_name == a).length} (${(((tagList.filter(b => b.monster_name == a && b.player_id == account.id).length / tagList.filter(b => b.monster_name == a).length) || 0) * 100).toFixed(0)}%)`).join('')}
                Total: ${tagList.filter(b => config.supabase.trackedRates.includes(b.monster_name) && b.player_id == account.id).length}/${tagList.filter(b => config.supabase.trackedRates.includes(b.monster_name)).length} (${(((tagList.filter(b => config.supabase.trackedRates.includes(b.monster_name) && b.player_id == account.id).length / tagList.filter(b => config.supabase.trackedRates.includes(b.monster_name)).length) || 0) * 100).toFixed(0)}%)
                **Attendance Rates:**${config.supabase.trackedRates.map(a => `\n${a}: ${signups.filter(b => b.event_id.monster_name == a && b.player_id == account.id).length}/${events.filter(b => b.monster_name == a).length} (${(((signups.filter(b => b.event_id.monster_name == a && b.player_id == account.id).length / events.filter(b => b.monster_name == a).length) || 0) * 100).toFixed(0)}%)`).join('')}
                Total: ${signups.filter(b => config.supabase.trackedRates.includes(b.event_id.monster_name) && b.player_id == account.id).length}/${events.filter(b => config.supabase.trackedRates.includes(b.monster_name)).length} (${(((signups.filter(b => config.supabase.trackedRates.includes(b.event_id.monster_name) && b.player_id == account.id).length / events.filter(b => config.supabase.trackedRates.includes(b.monster_name)).length) || 0) * 100).toFixed(0)}%)`);
        await interaction.editReply({ embeds: [newEmbed] });
    }
}