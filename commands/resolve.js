const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resolve'),
    async buttonHandler({ interaction, user, supabase, pointRules, archive }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'monster': {
                let event = args[2];
                
                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has already been closed`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                if (!user.staff) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This action can only be performed by staff`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                let unverified = archive[event].data.signups.filter(a => !a.verified).length;
                if (unverified > 0) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${unverified} user${unverified == 1 ? '' : 's'} have not been verified yet`)
                    await interaction.reply({ ephemeral: true, embeds: [embed] });
                    await archive[event].updateMessage();
                    return
                }

                let embed = new EmbedBuilder()
                    .setColor('#ffff00')
                    .setDescription('Are you sure you want to verify this raid?')
                let button = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`resolve-confirm-${event}`)
                            .setStyle(ButtonStyle.Success)
                            .setLabel('✓')
                    )
                await interaction.reply({ ephemeral: true, embeds: [embed], components: [button] });
                break;
            }
            case 'confirm': {
                let [event] = args.slice(2);
                
                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has been closed`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                let unverified = archive[event].data.signups.filter(a => !a.verified).length;
                if (unverified > 0) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${unverified} user${unverified == 1 ? '' : 's'} have not been verified yet`)
                    await interaction.reply({ ephemeral: true, embeds: [embed] });
                    await archive[event].updateMessage();
                    return
                }
                
                await interaction.deferReply({ ephemeral: true });
                archive[event].data.signups.forEach(async (signup, i, arr) => {
                    if (arr.slice(0, i).find(a => a.player_id.id == signup.player_id.id) == null) {
                        let { error } = await supabase.from(config.supabase.tables.users).update({last_camped: new Date() }).eq('id', signup.player_id.id);
                        if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error incrementing dkp', error.message)] });
                    }
                    let rules = pointRules.filter(a => a.monster_type == archive[event].data.monster_type);
                    let dkp = 0;
                    let ppp = 0;
                    ppp += parseFloat((Math.floor(signup.placeholders / 4) * 0.2).toFixed(1));
                    if (signup.tagged) {
                        let { error } = await supabase.from(config.supabase.tables.tags).insert({ player_id: signup.player_id.id, monster_name: archive[event].name });
                        if (error) console.log(`Error inserting ${archive[event].name} tag log for ${signup.player_id.username}: ${error.message}`);
                        let rule = rules.find(a => a.point_code == 't');
                        dkp += rule.dkp_value;
                        ppp += rule.ppp_value;
                    }
                    if (signup.killed) {
                        let rule = rules.find(a => a.point_code == 'k');
                        dkp += rule.dkp_value;
                        ppp += rule.ppp_value;
                    }
                    if (signup.rage) {
                        let rule = rules.find(a => a.point_code == 'r');
                        dkp += rule.dkp_value;
                        ppp += rule.ppp_value;
                    }
                    
                    if (dkp != 0) {
                        let { error } = await supabase.rpc('increment_points', { table_name: config.supabase.tables.users, id: signup.player_id.id, type: 'dkp', amount: dkp });
                        if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error incrementing dkp', error.message)] });
                        ({ error } = await supabase.rpc('increment_points', { table_name: config.supabase.tables.users, id: signup.player_id.id, type: 'lifetime_dkp', amount: dkp }));
                        if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error incrementing lifetime dkp', error.message)] });
                    }
                    if (ppp != 0) {
                        let { error } = await supabase.rpc('increment_points', { table_name: config.supabase.tables.users, id: signup.player_id.id, type: 'ppp', amount: ppp });
                        if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error incrementing ppp', error.message)] });
                        ({ error } = await supabase.rpc('increment_points', { table_name: config.supabase.tables.users, id: signup.player_id.id, type: 'lifetime_ppp', amount: ppp }));
                        if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error incrementing lifetime ppp', error.message)] });
                    }
                })
                
                let { error } = await supabase.from(config.supabase.tables.events).update({ verified: true }).eq('event_id', event);
                if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error updating signup', error.message)] });
                archive[event].verified = true;
                await archive[event].updateMessage();
                delete archive[event];

                let embed = new EmbedBuilder()
                    .setTitle('Success')
                    .setColor('#00ff00')
                    .setDescription('Raid verified')
                await interaction.editReply({ ephemeral: true, embeds: [embed] });
                break;
            }
        }
    }
}