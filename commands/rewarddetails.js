const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rewarddetails'),
    async buttonHandler({ config, interaction, supabase, monsterList, campRules, pointRules }) {
        let args = interaction.customId.split('-');
        let eventId = args[1];

        await interaction.deferReply({ ephemeral: true });
        let { data: event, error } = await supabase.from(config.supabase.tables.events).select('*').eq('event_id', eventId);
        if (error) return await interaction.editReply({ content: '', embeds: [errorEmbed('Error Fetching Event', error.message)] });
        event = event[0];
        if (event == null) return await interaction.editReply({ content: '', embeds: [errorEmbed('Error Fetching Event', `Couldn't find event with id ${eventId}`)] });

        let monster = monsterList.find(a => a.monster_name == event.monster_name);
        if (monster == null) return await interaction.editReply({ content: '', embeds: [errorEmbed('Error Fetching Monster', `Couldn't find monster with name ${event.monster_name}`)] });

        let signups;
        ({ data: signups, error } = await supabase.from(config.supabase.tables.signups).select('*, player_id (id, username)').eq('event_id', eventId));
        if (error) return await interaction.editReply({ content: '', embeds: [errorEmbed('Error Fetching Signups', error.message)] });

        signups = signups.map((a, i, arr) => {
            if (arr.slice(0, i).find(b => b.player_id.id == a.player_id.id) != null) return;
            a.windows = arr.filter(b => b.player_id.id == a.player_id.id).reduce((b, c) => b + c.windows || 0, 0);
            return a;
        }).filter(a => a != null);
        error = true;
        const newEmbed = new EmbedBuilder()
            .setTitle(monster.monster_name)
            .setDescription(`\`\`\`\n${(await Promise.all(
                signups.map(async a => {
                    error = true;
                    let points = { DKP: 0, PPP: 0 };
                    let campRule = campRules.find(b => b.monster_name == monster.monster_name);
                    points[campRule.type] += campRule.camp_points[a.windows];
                    let bonusRules = pointRules.filter(b => b.monster_type == monster.monster_type);
                    if (a.tagged) {
                        let rule = bonusRules.find(b => b.point_code == 't');
                        if (rule == null) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error fetching point rule', `Couldn't find tag point rule for monster type ${monster.monster_type}`)], components: [] });
                        points.DKP += rule.dkp_value;
                        points.PPP += rule.ppp_value;
                    }
                    if (a.killed) {
                        let rule = bonusRules.find(b => b.point_code == 'k');
                        if (rule == null) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error fetching point rule', `Couldn't find kill point rule for monster type ${monster.monster_type}`)], components: [] });
                        points.DKP += rule.dkp_value;
                        points.PPP += rule.ppp_value;

                        if (a.rage) {
                            let rule = bonusRules.find(b => b.point_code == 'r');
                            if (rule == null) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error fetching point rule', `Couldn't find rage point rule for monster type ${monster.monster_type}`)], components: [] });
                            points.DKP += rule.dkp_value;
                            points.PPP += rule.ppp_value;
                        }
                    }
                    error = false;
                    return `${a.player_id.username}${config.roster.placeholderMonsters.includes(monster.monster_name) ? ` - ${a.placeholders} PH` : ((a.windows == null || monster.max_windows == 1) ? '' : ` - ${a.windows}${event.windows == null ? '' : `/${event.windows}`} windows`)}${a.tagged ? ' - T' : ''}${a.killed ? ' - K' : ''}${a.rage ? ' - R' : ''}${config.roster.placeholderMonsters.includes(monster.monster_name) ? ` ${(Math.floor(a.placeholders / 4) * 0.2).toFixed(1)} PPP` : Object.keys(points).filter(b => points[b] != 0).map(b => ` ${points[b]} ${b}`).join('')}`
                })
            )).join('\n')}\n\`\`\``)
        if (!error) await interaction.editReply({ embeds: [newEmbed] });
    }
}