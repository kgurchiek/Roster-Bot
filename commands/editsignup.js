const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');
const config = require('../config.json');

let selections = {};
module.exports = {
    data: new SlashCommandBuilder()
        .setName('editsignup'),
    async buttonHandler({ interaction, user, supabase, archive, logChannel, monsters }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'monster': {
                let event = args[2];
                await interaction.deferReply({ ephemeral: true });

                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has been closed`)
                    return await interaction.editReply({ ephemeral: true, embeds: [embed] });
                }

                let signups;
                if (archive[event].data.signups) signups = archive[event].data.signups.filter(a => a.player_id.id == user.id);
                else if (archive[event].active) {
                    let { data, error } = await supabase.from(config.supabase.tables.signups).select('*, player_id (id, username)').eq('event_id', event).eq('player_id', user.id).eq('active', false);
                    if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error fetching signups', error.message)] });
                    signups = data;
                }
                signups.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                let signup = signups[0];

                if (signup == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`You have not completed any windows for this raid`)
                    return await interaction.editReply({ ephemeral: true, embeds: [embed] });
                }

                selections[interaction.id] = {
                    self: true,
                    event,
                    signup,
                    signupId: signup.signup_id,
                    windows: signup.windows,
                    tagged: signup.tagged,
                    killed: signup.killed,
                    rage: signup.rage,
                    placeholders: signup.placeholders,
                    screenshot: signup.screenshot,
                    userId: signup.player_id.id
                };

                interaction.customId = `editsignup-signup--${event}-${interaction.id}-true`;
                await this.selectHandler({ interaction, user, supabase, archive, logChannel });

                await interaction.editReply({ components });
                break;
            }
            case 'toggle': {
                let [option, event, id] = args.slice(2);

                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has been closed`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.update({ ephemeral: true, embeds: [embed], components: [], content: '' });
                }

                selections[id][option] = !selections[id][option];
                interaction.customId = `editsignup-signup-0-${event}-${id}-true`;
                this.selectHandler({ interaction, user, supabase, archive, logChannel });
                break;
            }
            case 'verify' : {
                let [event, signupId, id] = args.slice(2);
                
                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has been closed`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.update({ ephemeral: true, embeds: [embed], components: [], content: '' });
                }

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please use the verify user dropdown again')
                    return await interaction.update({ ephemeral: true, embeds: [embed], components: [], content: '' });
                }

                await interaction.deferUpdate({ ephemeral: true });
                let userSignups;
                if (archive[event].data.signups) userSignups = archive[event].data.signups.filter(a => a.player_id.id == selections[id].signup.player_id.id);
                else {
                    let { data, error } = await supabase.from(config.supabase.tables.signups).select('*, player_id (id, username)').eq('event_id', event).eq('player_id', user.id);
                    if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error fetching user signups', error.message)] });
                    userSignups = data;
                }
                let { error } = await supabase.from(config.supabase.tables.signups).update({ windows: 0 }).eq('event_id', event).eq('player_id', selections[id].signup.player_id.id);
                if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error updating past signups', error.message)], components: [], content: '' });
                let embed = new EmbedBuilder()
                    .setDescription(`${selections[id].signup.player_id.username}'${selections[id].signup.player_id.username.endsWith('s') ? '' : 's'} signups for the ${archive[event].name} raid have been set to ${selections[id].windows} windows (previousely ${userSignups.map(a => a.windows).join(', ')})`)
                await logChannel.send({ embeds: [embed] });
                if (!archive[event].active) userSignups.forEach(a => {
                    let signup = archive[event].data.signups.find(b => a.signup_id == b.signup_id);
                    if (signup != null) signup.windows = 0;
                });
                ({ error } = await supabase.from(config.supabase.tables.signups).update({
                    windows: selections[id].windows,
                    tagged: selections[id].tagged,
                    killed: selections[id].killed,
                    rage: selections[id].rage,
                    placeholders: selections[id].placeholders
                }).eq('signup_id', signupId));
                if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error updating signup', error.message)], components: [], content: '' });
                selections[id].signup.windows = selections[id].windows;
                selections[id].signup.tagged = selections[id].tagged;
                selections[id].signup.killed = selections[id].killed;
                selections[id].signup.rage = selections[id].rage;
                selections[id].signup.placeholders = selections[id].placeholders;
                await archive[event].updateMessage();
                embed = new EmbedBuilder()
                    .setTitle('Success')
                    .setColor('#00ff00')
                    .setDescription('Attendance updated')
                await interaction.editReply({ ephemeral: true, embeds: [embed], components: [], content: '' });
                break;
            }
        }
    },
    async selectHandler({ interaction, user, supabase, archive, logChannel }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'signup': {
                let [event, id, update] = args.slice(3);
                if (!id) id = interaction.id;
                if (!interaction.deferred) {
                    if (update == 'true') await interaction.deferUpdate();
                    else {
                        await interaction.deferReply({ ephemeral: true });
                        interaction.message.edit({ components: interaction.message.components });
                    }
                }

                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has been closed`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.editReply({ ephemeral: true, embeds: [embed], components: [], content: '' });
                }

                if (!(user.staff || selections[id]?.self)) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This action can only be performed by staff`)
                    return await interaction.editReply({ ephemeral: true, embeds: [embed], components: [], content: '' });
                }
        
                if (selections[id] == null) {
                    let signup = archive[event].data.signups.find(a => a.signup_id == interaction.values[0]);
                    selections[id] = {
                        self: false,
                        event,
                        signup,
                        signupId: signup.signup_id,
                        windows: signup.windows,
                        tagged: signup.tagged,
                        killed: signup.killed,
                        rage: signup.rage,
                        placeholders: signup.placeholders,
                        screenshot: signup.screenshot,
                        userId: signup.player_id.id
                    }
                }
                let components = [
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId(`editsignup-edit-${id}-windows-int`)
                                .setPlaceholder(`Windows${selections[id].windows == null ? '' : `: ${selections[id].windows}`}`)
                                .addOptions(
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('Custom')
                                        .setValue('custom'),
                                    ...new Array(Math.min(archive[event].windows || 24, 24)).fill().map((a, i) =>
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel(`${i + 1}`)
                                            .setValue(`${i + 1}`)
                                    )
                                )
                        ),
                    archive[event].placeholders == null ? null : new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId(`editsignup-edit-${id}-placeholders-int`)
                                .setPlaceholder(`Placeholders${selections[id].placeholders == null ? '' : `: ${selections[id].placeholders}`}`)
                                .addOptions(
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('Custom')
                                        .setValue('custom'),
                                    ...new Array(24).fill().map((a, i) =>
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel(`${i + 1}`)
                                            .setValue(`${i + 1}`)
                                    )
                                )
                        ),
                    archive[event].active ? null : new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`editsignup-toggle-tagged-${event}-${id}`)
                                .setStyle(selections[id].tagged == null ? ButtonStyle.Secondary : selections[id].tagged ? ButtonStyle.Success : ButtonStyle.Danger)
                                .setLabel(`Tagged${selections[id].tagged == null ? '' : selections[id].tagged ? ': ✓' : ': ✖'}`),
                            new ButtonBuilder()
                                .setCustomId(`editsignup-toggle-killed-${event}-${id}`)
                                .setStyle(selections[id].killed == null ? ButtonStyle.Secondary : selections[id].killed ? ButtonStyle.Success : ButtonStyle.Danger)
                                .setLabel(`Killed${selections[id].killed == null ? '' : selections[id].killed ? ': ✓' : ': ✖'}`),
                            new ButtonBuilder()
                                .setCustomId(`editsignup-toggle-rage-${event}-${id}`)
                                .setStyle(selections[id].rage ? ButtonStyle.Success : ButtonStyle.Danger)
                                .setLabel(`Rage${selections[id].rage ? ': ✓' : ': ✖'}`)
                        ),
                    new ActionRowBuilder()
                    .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`editsignup-verify-${event}-${selections[id].signupId}-${id}`)
                                .setStyle(ButtonStyle.Success)
                                .setLabel('✓')
                        )
                ].filter(a => a != null);
                let message = { ephemeral: true, components };
                if (selections[id].screenshot != null) message.content = `https://mrqccdyyotqulqmagkhm.supabase.co/storage/v1/object/public/${config.supabase.buckets.screenshots}/${selections[id].screenshot}`;
                await interaction.editReply(message);
                break;
            }
            case 'edit': {
                let [id, option, type] = args.slice(2);

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please use the verify user dropdown again')
                    return await interaction.update({ ephemeral: true, embeds: [embed], components: [], content: '' });
                }

                if (interaction.values[0] == 'custom') {
                    let modal = new ModalBuilder()
                        .setCustomId(`editsignup-${id}`)
                        .setTitle(`Edit Attendance`)
                        .addComponents(
                            new ActionRowBuilder()
                                .addComponents(
                                    new TextInputBuilder()
                                        .setCustomId(`${option}-${type}`)
                                        .setLabel(`${option[0].toUpperCase()}${option.slice(1)}`)
                                        .setStyle(TextInputStyle.Short)
                                )
                        )
                    await interaction.showModal(modal);
                } else {
                    switch (type) {
                        case 'int': {
                            selections[id][option] = parseInt(interaction.values[0]);
                            break;
                        }
                        case 'bool': {
                            selections[id][option] = interaction.values[0] == 'true';
                            break;
                        }
                    }
                    interaction.customId = `editsignup-signup-0-${selections[id].event}-${id}-true`;
                    this.selectHandler({ interaction, user, supabase, archive, logChannel });
                }
                break;
            }
        }
    },
    async modalHandler({ interaction, user, supabase, archive, logChannel }) {
        let args = interaction.customId.split('-');
        let id = args[1];

        if (selections[id] == null) {
            let embed = new EmbedBuilder()
                .setTitle('Error')
                .setColor('#ff0000')
                .setDescription('This message has expired, please use the verify user dropdown again')
            return await interaction.update({ ephemeral: true, embeds: [embed], components: [], content: '' });
        }

        let { customId, value } = interaction.fields.fields.values().next().value;
        let [option, type] = customId.split('-');
        switch(type) {
            case 'int': {
                value = parseInt(value);
                if (isNaN(value) || value < 0) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`Please enter a valid positive integer`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                selections[id][option] = value;
                break;
            }
        }
        
        interaction.customId = `editsignup-signup-0-${selections[id].event}-${id}-true`;
        this.selectHandler({ interaction, user, supabase, archive, logChannel });
    }
}