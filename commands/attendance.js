const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');

let selections = {};
module.exports = {
    data: new SlashCommandBuilder()
        .setName('attendance'),
    async buttonHandler({ config, interaction, user, supabase, monsters, archive, logChannel }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'monster': {
                let [event, signupId] = args.slice(2);

                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has been closed`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                
                let monster = archive[event].name;
                let maxWindows = archive[event].windows;
                let killer = archive[event].killer;

                let private = signupId != null;
                if (signupId == null) signupId = archive[event].data.signups?.find(a => a.active && a.player_id.id == user.id)?.signup_id;
                if (signupId == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('You were not signed up when this raid finished')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                let minWindows = archive[event].data.signups.filter(a => !a.active && a.player_id.id == user.id).reduce((a, b) => a += (b.windows || 0), 0);
                
                selections[interaction.id] = {
                    monster,
                    minWindows,
                    maxWindows,
                    killer,
                    event,
                    signupId
                };
                if (private) selections[interaction.id].message = interaction.message;

                await interaction.deferReply({ ephemeral: true });
                let { data, error } = await supabase.from(config.supabase.tables.signups).select('*').eq('signup_id', signupId).single();
                if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error fetching signup', error.message)] });

                if (data.tagged != null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('Your attendence in this raid has already been confirmed')
                    return await interaction.editReply({ ephemeral: true, embeds: [embed] });
                }

                let buttons = [
                    (monster == 'Tiamat' || archive[event].placeholders != null || maxWindows == null || maxWindows >= 25) ? null : new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setPlaceholder('Total Windows')
                                .setCustomId(`attendance-windows-${interaction.id}`)
                                .addOptions(
                                    ...Array(maxWindows - minWindows).fill().map((a, i) => 
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel(`${i + minWindows + 1}`)
                                            .setValue(`${i + 1}`)
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

                let { data, error } = await supabase.from(config.supabase.tables.signups).select('*').eq('signup_id', selections[id].signupId).single();
                if (error) return await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Error fetching signup', error.message)] });

                if (data.tagged != null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('Your attendence in this raid has already been confirmed')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                if (archive[selections[id].event].placeholders == null) {
                    if (selections[id].monster == 'Tiamat') {
                        let { data, error } = await supabase.from(config.supabase.tables.signups).select('*').eq('event_id', selections[id].event);
                        if (error) return await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Error fetching signups', error.message)] });
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
                            return await interaction.reply({ ephemeral: true, embeds: [embed] });
                        }
        
                        if (selections[id].windows < 0 || selections[id].windows > selections[id].maxWindows) {
                            let embed = new EmbedBuilder()
                                .setTitle('Error')
                                .setColor('#ff0000')
                                .setDescription(`Please enter a valid number of windows${selections[id].maxWindows == null ? '' : ` (max: ${selections[id].maxWindows})`}`)
                            return await interaction.reply({ ephemeral: true, embeds: [embed] });
                        }
                    }
                }
                
                interaction.customId = `attendance-confirm2-${id}`;
                this.buttonHandler({ config, interaction, user, supabase, monsters, archive, logChannel });
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
                
                if (archive[selections[id].event].placeholders == null && selections[id].windows == null) {
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

                if (data.tagged != null) {
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
                Object.assign(archive[selections[id].event].data.signups.find(a => a.signup_id == selections[id].signupId), {
                    windows: selections[id].windows,
                    killed: selections[id].kill,
                    tagged: selections[id].tag
                });
                await archive[selections[id].event].message.edit({ embeds: archive[selections[id].event].createEmbeds() });

                let embed = new EmbedBuilder()
                    .setTitle('Success')
                    .setColor('#00ff00')
                    .setDescription('Your attendance has been recorded')
                await interaction.editReply({ ephemeral: true, embeds: [embed] });

                let selection = selections[id];
                delete selections[id];
                if (selection.message) {
                    embed = new EmbedBuilder()
                        .setTitle('Attendence Confirmed')
                        .setColor('#00ff00')
                        .setDescription(`Your attendence for the ${selection.monster} raid has been recorded`)
                    await selection.message.edit({ embeds: [embed] });
                    embed = new EmbedBuilder().setDescription(`${user.username} has submitted attendence for the ${selection.monster} raid.`)
                    await logChannel.send({ embeds: [embed] });
                }
                break;
            }
        }
    },
    async selectHandler({ config, interaction }) {
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
    async modalHandler({ config, interaction, user, supabase, monsters, archive, logChannel }) {
        let args = interaction.customId.split('-');
        let id = args[1];

        let windows = parseInt(interaction.fields.getTextInputValue('windows'));
        if (isNaN(windows) || windows < 0 || (windows + selections[id].minWindows) > selections[id].maxWindows) {
            let embed = new EmbedBuilder()
                .setTitle('Error')
                .setColor('#ff0000')
                .setDescription(`Please enter a valid number of windows${selections[id].maxWindows == null ? '' : ` (max: ${selections[id].maxWindows - selections[id].minWindows})`}`)
            return await interaction.reply({ ephemeral: true, embeds: [embed] });
        }
        if (windows < selections[id].minWindows) {
            let embed = new EmbedBuilder()
                .setTitle('Error')
                .setColor('#ff0000')
                .setDescription(`Please eneter the **total** number of windows you camped (you already camped for ${selections[id].minWindows} window${selections[id].minWindows == 1 ? '' : 's'})`)
            return await interaction.reply({ ephemeral: true, embeds: [embed] });
        }
        selections[id].windows = windows;

        interaction.customId = `attendance-confirm2-${id}`;
        this.buttonHandler({ config, interaction, user, supabase, monsters, archive, logChannel });
    }
}