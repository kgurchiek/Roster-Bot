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

        const newEmbed = new EmbedBuilder()
            .setTitle(account.username)
            .setDescription(`**DKP:** ${account.dkp}\n**PPP:** ${account.ppp}\n**Frozen:** ${account.frozen}${account.last_camped == null ? '' : `\n**Last Camp**:<t:${Math.floor(new Date(account.last_camped).getTime() / 1000)}:R>`}\n**Tag Rates:**${config.supabase.trackedRates.map(a => `\n${a}: ${tagList.filter(b => b.monster_name == a && b.player_id == account.id).length}/${tagList.filter(b => b.monster_name == a).length} (${(((tagList.filter(b => b.monster_name == a && b.player_id == account.id).length / tagList.filter(b => b.monster_name == a).length) || 0) * 100).toFixed(0)}%)`).join('')}`);
        await interaction.editReply({ embeds: [newEmbed] });
    }
}