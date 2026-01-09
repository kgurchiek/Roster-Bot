const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');

let selections = {};
module.exports = {
    data: new SlashCommandBuilder()
        .setName('verifyall'),
    async buttonHandler({ config, interaction, user, supabase, archive, logChannel, pointRules, ocrCategory }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'event': {
                let event = args[2];
                
                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has been closed`)
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

                let embed = new EmbedBuilder()
                    .setTitle('Warning')
                    .setColor('#ffff00')
                    .setDescription('Are you sure you want to approve all remaining signups?')
                let buttons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`verifyall-confirm-${event}`)
                            .setStyle(ButtonStyle.Success)
                            .setLabel('✓')
                    )
                await interaction.reply({ ephemeral: true, embeds: [embed], components: [buttons] });
                break;
            }
            case 'confirm': {
                let event = args[2];
                
                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has been closed`)
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
                
                let signups = archive[event].data.signups.filter(a => a.active == true && a.verified == null);
                let type = archive[event].data.monster_type;
                if (type == 'NQ' && archive[event].day >= 4) type = 'HQ'; 
                let rules = pointRules.filter(a => a.monster_type == type);
                await interaction.deferUpdate();
                for (let signup of signups) {
                    let dkp = 0;
                    let ppp = 0;
                    if (signup.tagged) {
                        let { error } = await supabase.from(config.supabase.tables.tags).insert({ player_id: signup.player_id.id, monster_name: archive[event].name });
                        if (error) return await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Error recording monster tag log', error.message)] });

                        let rule = rules.find(a => a.point_code == 't');
                        if (rule == null) return await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Error fetching point rule', `Couldn't find tag point rule for monster type ${type}`)] });
                        dkp += rule.dkp_value;
                        ppp += rule.ppp_value;
                    }

                    if (dkp != 0) {
                        let { error } = await supabase.rpc('increment_points', { table_name: config.supabase.tables.users, id: signup.player_id.id, type: 'dkp', amount: dkp });
                        if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error incrementing dkp', error.message)], components: [] });
                        ({ error } = await supabase.rpc('increment_points', { table_name: config.supabase.tables.users, id: signup.player_id.id, type: 'lifetime_dkp', amount: dkp }));
                        if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error incrementing lifetime dkp', error.message)], components: [] });
                    }
                    if (ppp != 0) {
                        let { error } = await supabase.rpc('increment_points', { table_name: config.supabase.tables.users, id: signup.player_id.id, type: 'ppp', amount: ppp });
                        if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error incrementing ppp', error.message)], components: [] });
                        ({ error } = await supabase.rpc('increment_points', { table_name: config.supabase.tables.users, id: signup.player_id.id, type: 'lifetime_ppp', amount: ppp }));
                        if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error incrementing lifetime ppp', error.message)], components: [] });
                    }

                    let { error } = await supabase.from(config.supabase.tables.signups).update({ verified: true }).eq('signup_id', signup.signup_id);
                    if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error updating signup', error.message)], components: [] });
                    signup.verified = true;

                    let channelName = (archive[event].group ? archive[event].group.map(a => a).join('—') : archive[event].name).replaceAll(' ', '-').toLowerCase();
                    let channels = [...(await ocrCategory.guild.channels.fetch(null, { force: true })).values()].filter(a => a.parentId == ocrCategory.id);
                    let channel = channels.find(a => a.name == channelName);
                    if (channel) {
                        let message;
                        try {
                            message = await channel.messages.fetch(signup.screenshot);
                        } catch (err) {
                            if (!err.message.includes('Unknown Message')) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error fetching screenshot message', error.message)], components: [] });
                        }
                        if (message) {
                            try {
                                await message.delete();
                            } catch (err) {
                                return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error deleting screenshot message', error.message)], components: [] });
                            }
                        }
                    }

                    
                    let embed = new EmbedBuilder()
                        .setDescription(`${user.username} approved ${signup.player_id.username}'${signup.player_id.username.endsWith('s') ? '' : 's'} tag screenshot of "${archive[event].name}".`)
                    await logChannel.send({ embeds: [embed] });
                }
                await archive[event].updateMessage();
                await archive[event].updatePanel();

                let embed = new EmbedBuilder()
                    .setTitle('Success')
                    .setColor('#00ff00')
                    .setDescription('All remaining signups have been verified')
                await interaction.editReply({ embeds: [embed], components: [] });
                break;
            }
        }
    }
}