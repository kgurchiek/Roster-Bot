const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');
const config = require('../config.json');

let selections = {};
module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify'),
    async selectHandler({ interaction, supabase, archive }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'signup': {
                let event = args[2];
                await interaction.deferReply({ ephemeral: true });
                await interaction.message.edit({ components: interaction.message.components });
        
                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has been closed`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.editReply({ ephemeral: true, embeds: [embed] });
                }
        
                let signup = archive[event].data.signups[interaction.values[0]];
                let errors = [];
                if (signup.tagged == null) errors.push('User has not confirmed attendance');
                if (signup.screenshot == null) errors.push('User has not uploaded screenshot');
                if (errors.length > 0) {
                    let embed = new EmbedBuilder()
                        .setTitle('Warning')
                        .setColor('#ffff00')
                        .setDescription(`${errors.map(a => `- ${a}`).join('\n')}\n\n Are you sure you want to continue?`)
                    let components = [
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`verify-confirm-${event}-${interaction.values[0]}`)
                                    .setStyle(ButtonStyle.Success)
                                    .setLabel('✓')
                            )
                    ]
                    return await interaction.editReply({ ephemeral: true, embeds: [embed], components });
                }

                interaction.customId = `verify-confirm-${event}-${interaction.values[0]}`;
                this.buttonHandler({ interaction, supabase, archive });
                break;
            }
            case 'edit': {
                let [id, option, type] = args.slice(2);

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please use the verify user dropdown again')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                if (interaction.values[0] == 'custom') {
                    let modal = new ModalBuilder()
                        .setCustomId(`verify-${id}`)
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
                    interaction.customId = `verify-edit-${selections[id].event}-${selections[id].index}-${id}-true`;
                    this.buttonHandler({ interaction, supabase, archive });
                }
                break;
            }
        }
    },
    async buttonHandler({ interaction, supabase, archive }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'confirm': {
                let [event, index, id] = args.slice(2);
                if (id == null) id = interaction.id;
                if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });
                
                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has been closed`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.editReply({ ephemeral: true, embeds: [embed] });
                }

                let signup = archive[event].data.signups[index];
                if (selections[id] == null) selections[id] = {
                    event,
                    index,
                    signupId: signup.signup_id,
                    windows: signup.windows,
                    tagged: signup.tagged,
                    killed: signup.killed,
                    rage: signup.rage,
                    placeholders: signup.placeholders
                }
                let embed = new EmbedBuilder()
                    .setTitle(`${signup.player_id.username}'${signup.player_id.username.endsWith('s') ? '' : 's'} Attendance (${signup.verified ? 'Verified' : 'Unverified'})`)
                    .addFields(
                        { name: 'Windows', value: selections[id].windows == null ? 'null' : String(selections[id].windows) },
                        { name: 'Tagged', value: selections[id].tagged == null ? 'null' : selections[id].tagged ? 'True' : 'False' },
                        { name: 'Killed', value: selections[id].killed == null ? 'null' : selections[id].killed ? 'True' : 'False' },
                        { name: 'Rage', value: selections[id].rage ? 'True' : 'False' },
                        ...(archive[event].placeholders == null ? [] : [{ name: 'Placeholders', value: selections[id].placeholders == null ? 'null' : String(selections[id].placeholders) }])
                    )
                    .setImage(`https://mrqccdyyotqulqmagkhm.supabase.co/storage/v1/object/public/${config.supabase.buckets.screenshots}/${signup.screenshot}`)
                let components = [
                    new ActionRowBuilder()
                        .addComponents(
                            ...signup.verified ?
                                [
                                    new ButtonBuilder()
                                        .setCustomId(`verify-unverify-${event}-${signup.signup_id}-${interaction.id}`)
                                        .setStyle(ButtonStyle.Danger)
                                        .setLabel('✖')
                                ] :
                                [
                                    new ButtonBuilder()
                                        .setCustomId(`verify-edit-${event}-${index}-${interaction.id}`)
                                        .setStyle(ButtonStyle.Primary)
                                        .setLabel('📝'),
                                    new ButtonBuilder()
                                        .setCustomId(`verify-verify-${event}-${signup.signup_id}-${interaction.id}`)
                                        .setStyle(ButtonStyle.Success)
                                        .setLabel('✓')
                                ]
                        )
                ]
                await interaction.editReply({ ephemeral: true, embeds: [embed], components });
                break;
            }
            case 'verify': {
                let [event, signupId, id] = args.slice(2);
                
                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has been closed`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please use the verify user dropdown again')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                
                await interaction.deferReply({ ephemeral: true });
                let { error } = await supabase.from(config.supabase.tables.signups).update({
                    windows: selections[id].windows,
                    tagged: selections[id].tagged,
                    killed: selections[id].killed,
                    rage: selections[id].rage,
                    verified: true
                }).eq('signup_id', signupId);
                if (error) return await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Error updating signup', error.message)] });
                let signup = archive[event].data.signups.find(a => a.signup_id == signupId);
                signup.windows = selections[id].windows;
                signup.tagged = selections[id].tagged;
                signup.killed = selections[id].killed;
                signup.rage = selections[id].rage;
                signup.verified = true;
                await archive[event].updateMessage();

                let embed = new EmbedBuilder()
                    .setTitle('Success')
                    .setColor('#00ff00')
                    .setDescription('Attendance marked as verified')
                await interaction.editReply({ ephemeral: true, embeds: [embed] });
                break;
            }
            case 'unverify': {
                let [event, signupId] = args.slice(2);
                
                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has been closed`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                
                await interaction.deferReply({ ephemeral: true });
                let { error } = await supabase.from(config.supabase.tables.signups).update({ verified: false }).eq('signup_id', signupId);
                if (error) return await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Error updating signup', error.message)] });
                let signup = archive[event].data.signups.find(a => a.signup_id == signupId);
                signup.verified = false;
                await archive[event].updateMessage();

                let embed = new EmbedBuilder()
                    .setTitle('Success')
                    .setColor('#00ff00')
                    .setDescription('Attendance marked as unverified')
                await interaction.editReply({ ephemeral: true, embeds: [embed] });
                break;
            }
            case 'edit': {
                let [event, index, id, update] = args.slice(2);
                update = update == 'true';

                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has been closed`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This message has expired, please use the verify user dropdown again`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                
                let signup = archive[event].data.signups[index];
                let components = [
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId(`verify-edit-${id}-windows-int`)
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
                                .setCustomId(`verify-edit-${id}-placeholders-int`)
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
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`verify-toggle-tagged-${event}-${index}-${id}`)
                                .setStyle(selections[id].tagged == null ? ButtonStyle.Secondary : selections[id].tagged ? ButtonStyle.Success : ButtonStyle.Danger)
                                .setLabel(`Tagged${selections[id].tagged == null ? '' : selections[id].tagged ? ': ✓' : ': ✖'}`),
                            new ButtonBuilder()
                                .setCustomId(`verify-toggle-killed-${event}-${index}-${id}`)
                                .setStyle(selections[id].killed == null ? ButtonStyle.Secondary : selections[id].killed ? ButtonStyle.Success : ButtonStyle.Danger)
                                .setLabel(`Killed${selections[id].killed == null ? '' : selections[id].killed ? ': ✓' : ': ✖'}`),
                            new ButtonBuilder()
                                .setCustomId(`verify-toggle-rage-${event}-${index}-${id}`)
                                .setStyle(selections[id].rage ? ButtonStyle.Success : ButtonStyle.Danger)
                                .setLabel(`Rage${selections[id].rage ? ': ✓' : ': ✖'}`)
                        ),
                    new ActionRowBuilder()
                    .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`verify-verify-${event}-${selections[id].signupId}-${id}`)
                                .setStyle(ButtonStyle.Success)
                                .setLabel('✓')
                        )
                ].filter(a => a != null);
                let message = { ephemeral: true, components };
                if (signup.screenshot != null) message.content = `https://mrqccdyyotqulqmagkhm.supabase.co/storage/v1/object/public/${config.supabase.buckets.screenshots}/${signup.screenshot}`;
                if (update) await interaction.update(message);
                else await interaction.reply(message);
                break;
            }
            case 'toggle': {
                let [option, event, index, id] = args.slice(2);

                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has been closed`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                selections[id][option] = !selections[id][option];
                interaction.customId = `verify-edit-${event}-${index}-${id}-true`;
                this.buttonHandler({ interaction, supabase, archive });
                break;
            }
        }
    },
    async modalHandler({ interaction, supabase, archive }) {
        let args = interaction.customId.split('-');
        let id = args[1];

        if (selections[id] == null) {
            let embed = new EmbedBuilder()
                .setTitle('Error')
                .setColor('#ff0000')
                .setDescription('This message has expired, please use the verify user dropdown again')
            return await interaction.reply({ ephemeral: true, embeds: [embed] });
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
        
        interaction.customId = `verify-edit-${selections[id].event}-${selections[id].index}-${id}`;
        this.buttonHandler({ interaction, supabase, archive });
    }
}