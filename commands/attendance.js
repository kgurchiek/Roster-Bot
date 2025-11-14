const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');
const config = require('../config.json');

let selections = {};
module.exports = {
    data: new SlashCommandBuilder()
        .setName('attendance'),
    async buttonHandler({ interaction, user, supabase, groupList, monsters, archive }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'monster': {
                let [archiveId, signupId] = args.slice(2);
                let monster = archive[archiveId].name;
                let maxWindows = archive[archiveId].windows;
                let killer = archive[archiveId].killer;
                let event = archive[archiveId].event;

                if (signupId == null) signupId = archive[archiveId].data.signups.find(a => a.player_id == user.id)
                if (signupId == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('You did not participate in this raid')
                    await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                
                selections[interaction.id] = {
                    archiveId,
                    monster,
                    maxWindows: maxWindows,
                    killer,
                    event,
                    signupId,
                    message: interaction.message
                };

                await interaction.deferReply({ ephemeral: true });
                let { data, error } = await supabase.from(config.supabase.tables.signups).select('*').eq('signup_id', signupId).single();
                if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error fetching signup', error.message)] });

                if (data.windows != null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('Your attendence in this raid has already been confirmed')
                    return await interaction.editReply({ ephemeral: true, embeds: [embed] });
                }

                let buttons = [
                    (monster == 'Tiamat' || maxWindows == null || maxWindows >= 25) ? null : new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setPlaceholder('Windows')
                                .setCustomId(`attendance-windows-${interaction.id}`)
                                .addOptions(
                                    ...Array(maxWindows + 1).fill().map((a, i) => 
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel(`${i}`)
                                            .setValue(`${i}`)
                                    )
                                )
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setPlaceholder(`Did you tag ${monster}?`)
                                .setCustomId(`attendance-tag-${interaction.id}`)
                                .addOptions(
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('Yes')
                                        .setValue('yes'),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('No')
                                        .setValue('no')
                                )
                        ),
                    (killer != config.roster.team) ? null : new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setPlaceholder(`Were you in the kill?`)
                                .setCustomId(`attendance-kill-${interaction.id}`)
                                .addOptions(
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('Yes')
                                        .setValue('yes'),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('No')
                                        .setValue('no')
                                )
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`attendance-confirm-${interaction.id}`)
                                .setLabel('✓')
                                .setStyle(ButtonStyle.Success)
                        )
                ].filter(a => a != null)
                await interaction.editReply({ ephemeral: true, components: buttons });
                break;
            }
            case 'confirm': {
                let id = args[2];

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please click the sign up button again')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                if (selections[id].killer == config.roster.team && selections[id].kill == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('Please indicate whether or not you killed the monster')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                if (selections[id].tag == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('Please indicate whether or not you tagged the monster')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                await interaction.deferReply({ ephemeral: true });
                let { data, error } = await supabase.from(config.supabase.tables.signups).select('*').eq('signup_id', selections[id].signupId).single();
                if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error fetching signup', error.message)] });

                if (data.windows != null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('Your attendence in this raid has already been confirmed')
                    return await interaction.editReply({ ephemeral: true, embeds: [embed] });
                }

                if (selections[id].monster == 'Tiamat') {
                    let { data, error } = await supabase.from(config.supabase.tables.signups).select('*').eq('event_id', selections[id].event);
                    if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error fetching signups', error.message)] });
                    selections[id].windows = data.length;
                } else if (selections[id].maxWindows == null || selections[id].maxWindows >= 25) {
                    let modal = new ModalBuilder()
                        .setCustomId(`attendance-${id}`)
                        .setTitle(`${selections[id].monster} Attendance`)
                        .addComponents(
                            new ActionRowBuilder()
                                .addComponents(
                                    new TextInputBuilder()
                                        .setCustomId('windows')
                                        .setLabel('Windows')
                                        .setStyle(TextInputStyle.Short)
                                )
                        )

                    return await interaction.showModal(modal);
                } else {
                    if (selections[id].windows == null) {
                        let embed = new EmbedBuilder()
                            .setTitle('Error')
                            .setColor('#ff0000')
                            .setDescription('Please select the number of windows')
                        return await interaction.editReply({ ephemeral: true, embeds: [embed] });
                    }
    
                    if (selections[id].windows < 0 || selections[id].windows > selections[id].maxWindows) {
                        let embed = new EmbedBuilder()
                            .setTitle('Error')
                            .setColor('#ff0000')
                            .setDescription(`Please enter a valid number of windows${selections[id].maxWindows == Infinity ? '' : ` (max: ${selections[id].maxWindows})`}`)
                        return await interaction.editReply({ ephemeral: true, embeds: [embed] });
                    }
                }

                
                interaction.customId = `attendance-confirm2-${id}`;
                this.buttonHandler({ interaction, supabase, groupList, monsters, archive });
                break;
            }
            case 'confirm2': {
                let id = args[2];

                if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please click the sign up button again')
                    return await interaction.editReply({ ephemeral: true, embeds: [embed] });
                }
                
                if (selections[id].windows == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('Please select the number of windows')
                    return await interaction.editReply({ ephemeral: true, embeds: [embed] });
                }

                if (selections[id].killer == config.roster.team && selections[id].kill == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('Please indicate whether or not you killed the monster')
                    return await interaction.editReply({ ephemeral: true, embeds: [embed] });
                }

                if (selections[id].tag == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('Please indicate whether or not you tagged the monster')
                    return await interaction.editReply({ ephemeral: true, embeds: [embed] });
                }

                let { data, error } = await supabase.from(config.supabase.tables.signups).select('*').eq('signup_id', selections[id].signupId).single();
                if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error fetching signup', error.message)] });

                if (data.windows != null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('Your attendence in this raid has already been confirmed')
                    return await interaction.editReply({ ephemeral: true, embeds: [embed] });
                }

                ({ error } = await supabase.from(config.supabase.tables.signups).update({
                    windows: selections[id].windows,
                    killed: selections[id].kill,
                    tagged: selections[id].tag
                }).eq('signup_id', selections[id].signupId));
                if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error updating signup', error.message)] });
                Object.assign(archive[selections[id].archiveId].data.signups.find(a => a.signup_id == selections[id].signupId), {
                    windows: selections[id].windows,
                    killed: selections[id].kill,
                    tagged: selections[id].tag
                });
                await archive[selections[id].archiveId].message.edit({ embeds: archive[selections[id].archiveId].createEmbeds() });

                let embed = new EmbedBuilder()
                    .setTitle('Success')
                    .setColor('#00ff00')
                    .setDescription('Your attendance has been recorded')
                await interaction.editReply({ ephemeral: true, embeds: [embed] });

                let selection = selections[id];
                delete selections[id];
                embed = new EmbedBuilder()
                    .setTitle('Attendence Confirmed')
                    .setColor('#00ff00')
                    .setDescription(`Your attendence for the ${selection.monster} raid has been recorded`)
                await selection.message.edit({ embeds: [embed], components: [] });
                break;
            }
        }
    },
    async selectHandler({ interaction }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'windows': {
                let id = args[2];

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please click the sign up button again')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                interaction.deferUpdate();
                selections[id].windows = parseInt(interaction.values[0]);
                break;
            }
            case 'kill': {
                let id = args[2];

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please click the sign up button again')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                interaction.deferUpdate();
                selections[id].kill = interaction.values[0].toLowerCase() == 'yes';
                break;
            }
            case 'tag': {
                let id = args[2];

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please click the sign up button again')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                interaction.deferUpdate();
                selections[id].tag = interaction.values[0].toLowerCase() == 'yes';
                break;
            }
        }
    },
    async modalHandler({ interaction, supabase, groupList, monsters }) {        
        let args = interaction.customId.split('-');
        let id = args[1];

        let windows = parseInt(interaction.fields.getTextInputValue('windows'));
        if (isNaN(windows) || windows < 0 || windows > selections[id].maxWindows) {
            let embed = new EmbedBuilder()
                .setTitle('Error')
                .setColor('#ff0000')
                .setDescription(`Please enter a valid number of windows${selections[id].maxWindows == Infinity ? '' : ` (max: ${selections[id].maxWindows})`}`)
            return await interaction.reply({ ephemeral: true, embeds: [embed] });
        }
        selections[id].windows = windows;

        interaction.customId = `attendance-confirm2-${id}`;
        this.buttonHandler({ interaction, supabase, groupList, monsters });
    }
}