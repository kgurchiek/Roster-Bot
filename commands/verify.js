const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');
const config = require('../config.json');

let selections = {};
module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify'),
    async selectHandler({ interaction, user, supabase, archive, logChannel, pointRules }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'signup': {
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
        
                let signup = archive[event].data.signups.find(a => a.signup_id == interaction.values[0]);
                let errors = [];
                if (signup.tagged == null) errors.push('User has not confirmed attendance');
                if (signup.screenshot == null) errors.push('User has not uploaded screenshot');

                selections[interaction.message.id] = signup;
                await interaction.deferUpdate();
                break;
            }
            case 'edit': {
                let [id, option, type] = args.slice(2);

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please use the verify user dropdown again')
                    return await interaction.update({ ephemeral: true, embeds: [embed], components: [] });
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
                    interaction.customId = `verify-edit-${id}`;
                    this.buttonHandler({ interaction, user, supabase, archive, logChannel, pointRules });
                }
                break;
            }
        }
    },
    async buttonHandler({ interaction, user, supabase, archive, logChannel, pointRules }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'view': {
                let [event, id] = args.slice(2);
                if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });

                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has been closed`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.editReply({ ephemeral: true, embeds: [embed] });
                }

                let signup;
                if (id == null) {
                    id = interaction.id;

                    signup = selections[interaction.message.id];
                    if (signup == null) {
                        let embed = new EmbedBuilder()
                            .setTitle('Error')
                            .setColor('#ff0000')
                            .setDescription(`Please select a user from the dropdown`)
                        await interaction.message.edit({ components: interaction.message.components });
                        return await interaction.editReply({ ephemeral: true, embeds: [embed] });
                    }
                    
                    if (selections[id] == null) selections[id] = {
                        event,
                        signup,
                        signupId: signup.signup_id,
                        windows: archive[event].name == 'Tiamat' ? archive[event].data.signups.filter(a => a.player_id.id == signup.player_id.id) : archive[event].data.signups.filter(a => a.player_id.id == signup.player_id.id).reduce((a, b) => a + b?.windows || 0, 0),
                        tagged: signup.tagged,
                        killed: signup.killed,
                        rage: signup.rage,
                        placeholders: signup.placeholders
                    }
                } else {
                    if (selections[id] == null) {
                        let embed = new EmbedBuilder()
                            .setTitle('Error')
                            .setColor('#ff0000')
                            .setDescription(`This message has expired, please use the verify user dropdown again`)
                        return await interaction.editReply({ ephemeral: true, embeds: [embed], components: [] });
                    }

                    ({ signup } = selections[id]);
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
                            new ButtonBuilder()
                                .setCustomId(`verify-edit-${id}`)
                                .setStyle(ButtonStyle.Primary)
                                .setLabel('📝')
                        )
                ]
                await interaction.editReply({ ephemeral: true, embeds: [embed], components });
                break;
            }
            case 'confirm': {
                let id = args[2];
                
                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This message has expired, please use the verify user dropdown again`)
                    return await interaction.update({ ephemeral: true, embeds: [embed], components: [] });
                }
                
                let { event, signup } = selections[id];

                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has been closed`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.update({ ephemeral: true, embeds: [embed], components: [] });
                }
                
                await interaction.deferUpdate();
                let { error } = await supabase.from(config.supabase.tables.signups).update({
                    windows: selections[id].windows,
                    tagged: selections[id].tagged,
                    killed: selections[id].killed,
                    rage: selections[id].rage
                }).eq('signup_id', signup.signup_id);
                if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error updating signup', error.message)], components: [] });
                signup.windows = selections[id].windows;
                signup.tagged = selections[id].tagged;
                signup.killed = selections[id].killed;
                signup.rage = selections[id].rage;
                await archive[event].updateMessage();
                await archive[event].updatePanel();

                interaction.customId = `interaction-view-${event}-${id}`;
                this.buttonHandler({ interaction, user, supabase, archive, logChannel, pointRules });
                break;
            }
            case 'verify': {
                let event = args[2];
                
                if (selections[interaction.message.id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This message has expired, please use the verify user dropdown again`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.update({ ephemeral: true, embeds: [embed], components: [] });
                }
                
                let signup = selections[interaction.message.id];

                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has been closed`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.update({ ephemeral: true, embeds: [embed], components: [] });
                }
                
                let type = archive[event].data.monster_type;
                if (type == 'NQ' && archive[event].day >= 4) type = 'HQ'; 
                let rules = pointRules.filter(a => a.monster_type == type);
                let dkp = 0;
                let ppp = 0;
                if (signup.tagged) {
                    let rule = rules.find(a => a.point_code == 't');
                    if (rule == null) return await interaction.update({ ephemeral: true, embeds: [errorEmbed('Error fetching point rule', `Couldn't find tag point rule for monster type ${type}`)], components: [] });
                    dkp += rule.dkp_value;
                    ppp += rule.ppp_value;
                }
                if (signup.killed) {
                    let rule = rules.find(a => a.point_code == 'k');
                    if (rule == null) return await interaction.update({ ephemeral: true, embeds: [errorEmbed('Error fetching point rule', `Couldn't find kill point rule for monster type ${type}`)], components: [] });
                    dkp += rule.dkp_value;
                    ppp += rule.ppp_value;

                    if (signup.rage) {
                        let rule = rules.find(a => a.point_code == 'r');
                        if (rule == null) return await interaction.update({ ephemeral: true, embeds: [errorEmbed('Error fetching point rule', `Couldn't find rage point rule for monster type ${type}`)], components: [] });
                        dkp += rule.dkp_value;
                        ppp += rule.ppp_value;
                    }
                }

                await interaction.deferUpdate();
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
                await archive[event].updateMessage();
                await archive[event].updatePanel();

                let embed = new EmbedBuilder()
                    .setDescription(`${user.username} marked ${signup.player_id.username}'${signup.player_id.username.endsWith('s') ? '' : 's'} attendance for the ${archive[event].name} raid as verified.`)
                await logChannel.send({ embeds: [embed] });
                break;
            }
            case 'decline': {
                let event = args[2];
                
                if (selections[interaction.message.id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This message has expired, please use the verify user dropdown again`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.update({ ephemeral: true, embeds: [embed], components: [] });
                }
                
                let signup = selections[interaction.message.id];

                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has been closed`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.update({ ephemeral: true, embeds: [embed], components: [] });
                }
                
                await interaction.deferUpdate();
                let { error } = await supabase.from(config.supabase.tables.signups).update({ verified: false }).eq('signup_id', signup.signup_id);
                if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error updating signup', error.message)], components: [] });
                signup.verified = false;
                await archive[event].updateMessage();
                await archive[event].updatePanel();

                let embed = new EmbedBuilder()
                    .setDescription(`${user.username} marked ${signup.player_id.username}'${signup.player_id.username.endsWith('s') ? '' : 's'} attendance for the ${archive[event].name} raid as declined.`)
                await logChannel.send({ embeds: [embed] });
                break;
            }
            case 'edit': {
                let id = args[2];

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This message has expired, please use the verify user dropdown again`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.update({ ephemeral: true, embeds: [embed], components: [] });
                }
                
                let { event, signup } = selections[id];

                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has been closed`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.update({ ephemeral: true, embeds: [embed], components: [] });
                }
                
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
                                .setCustomId(`verify-toggle-tagged-${id}`)
                                .setStyle(selections[id].tagged == null ? ButtonStyle.Secondary : selections[id].tagged ? ButtonStyle.Success : ButtonStyle.Danger)
                                .setLabel(`Tagged${selections[id].tagged == null ? '' : selections[id].tagged ? ': ✓' : ': ✖'}`),
                            new ButtonBuilder()
                                .setCustomId(`verify-toggle-killed-${id}`)
                                .setStyle(selections[id].killed == null ? ButtonStyle.Secondary : selections[id].killed ? ButtonStyle.Success : ButtonStyle.Danger)
                                .setLabel(`Killed${selections[id].killed == null ? '' : selections[id].killed ? ': ✓' : ': ✖'}`),
                            new ButtonBuilder()
                                .setCustomId(`verify-toggle-rage-${id}`)
                                .setStyle(selections[id].rage ? ButtonStyle.Success : ButtonStyle.Danger)
                                .setLabel(`Rage${selections[id].rage ? ': ✓' : ': ✖'}`)
                        ),
                    new ActionRowBuilder()
                    .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`verify-confirm-${id}`)
                                .setStyle(ButtonStyle.Success)
                                .setLabel('✓')
                        )
                ].filter(a => a != null);
                let message = { ephemeral: true, components };
                if (signup.screenshot != null) message.content = `https://mrqccdyyotqulqmagkhm.supabase.co/storage/v1/object/public/${config.supabase.buckets.screenshots}/${signup.screenshot}`;
                await interaction.update(message);
                break;
            }
            case 'toggle': {
                let [option, id] = args.slice(2);

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This message has expired, please use the verify user dropdown again`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.update({ ephemeral: true, embeds: [embed], components: [] });
                }

                selections[id][option] = !selections[id][option];
                interaction.customId = `verify-edit-${id}`;
                this.buttonHandler({ interaction, user, supabase, archive, logChannel, pointRules });
                break;
            }
        }
    },
    async modalHandler({ interaction, user, supabase, archive, logChannel, pointRules }) {
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
        
        interaction.customId = `verify-edit-${id}`;
        this.buttonHandler({ interaction, user, supabase, archive, logChannel, pointRules });
    }
}