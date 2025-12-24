const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');

let selections = {};
module.exports = {
    data: new SlashCommandBuilder()
        .setName('editevent'),
    async buttonHandler({ config, interaction, client, user, supabase, logChannel, campRules }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'event': {
                let eventId = args[2];

                if (!user.staff) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This action can only be performed by staff`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed], components: [], content: '' });
                }

                await interaction.deferReply({ ephemeral: true });
                let signups;
                ({ data: signups, error } = await supabase.from(config.supabase.tables.signups).select('*, player_id (id, username)').eq('event_id', eventId));
                if (error) return await interaction.editReply({ content: '', embeds: [errorEmbed('Error Fetching Signups', error.message)], components: [] });
                signups = signups.filter((a, i) => a.active || signups.find((b, j) => b.player_id.id == a.player_id.id && (b.active || j > i)) == null);

                let components = new Array(Math.ceil(signups.length / 25)).fill().map((a, i) =>
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setPlaceholder('Select a member....')
                                .setCustomId(`editevent-signup-${i}-${eventId}--${interaction.message.id}`)
                                .addOptions(
                                    ...Array(Math.min(25, signups.length - i * 25)).fill().map((a, j) =>
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel(`${signups[i * 25 + j].player_id.username}`)
                                            .setValue(`${signups[i * 25 + j].signup_id}`)
                                    )
                                )
                        )
                    )
                await interaction.editReply({ components });
                break;
            }
            case 'toggle': {
                let [option, id] = args.slice(2);

                selections[id].signup[option] = !selections[id].signup[option];
                interaction.customId = `editevent-signup---${id}`;
                this.selectHandler({ config, interaction, user, supabase, logChannel });
                break;
            }
            case 'verify' : {
                let [id] = args.slice(2);

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please use the edit button again')
                    return await interaction.update({ ephemeral: true, embeds: [embed], components: [], content: '' });
                }

                await interaction.deferUpdate();
                let { data: eventSignups, error } = await supabase.from(config.supabase.tables.signups).select('*, player_id (id, username)').eq('event_id', selections[id].event.event_id);
                if (error) return await interaction.editReply({ content: '', embeds: [errorEmbed('Error Fetching Signups', error.message)], components: [] });
                let userSignups = eventSignups.filter(a => a.player_id.id == selections[id].signup.player_id.id);

                ({ error } = await supabase.from(config.supabase.tables.signups).update({ windows: 0 }).eq('event_id', selections[id].event.event_id).eq('player_id', selections[id].signup.player_id.id));
                if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error updating past signups', error.message)], components: [], content: '' });
                let embed = new EmbedBuilder()
                    .setDescription(`${selections[id].signup.player_id.username}'${selections[id].signup.player_id.username.endsWith('s') ? '' : 's'} signups for the past ${selections[id].event.monster_name} raid (raid ${selections[id].event.event_id}) have been set to ${selections[id].signup.windows} windows (previousely ${userSignups.map(a => a.windows).join(', ')})`)
                await logChannel.send({ embeds: [embed] });
                userSignups.filter(a => a.signup_id != selections[id].signup.signup_id).forEach(a => a.windows = 0);

                ({ error } = await supabase.from(config.supabase.tables.signups).update({
                    windows: selections[id].signup.windows,
                    tagged: selections[id].signup.tagged,
                    killed: selections[id].signup.killed,
                    rage: selections[id].signup.rage,
                    placeholders: selections[id].signup.placeholders
                }).eq('signup_id', selections[id].signup.signup_id));
                if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error updating past signup', error.message)], components: [], content: '' });

                let total = { dkp: 0, ppp: 0 };
                eventSignups.forEach(async (signup, i, arr) => {
                    let campRule = campRules.find(a => a.monster_name == selections[id].event.monster_name);
                    if (campRule == null) return console.log(`Error: couldn't find camp rule for monster ${selections[id].event.monster_name}`);
                    total.ppp += parseFloat((Math.floor(signup.placeholders / 4) * 0.2).toFixed(1));
                    let campPoints = campRule.camp_points[Math.min(signup.windows - 1, campRule.camp_points.length - 1)] || 0;
                    if (campRule.bonus_windows) campPoints += Math.min(Math.floor(signup.windows / campRule.bonus_windows) * campRule.bonus_points, campRule.max_bonus);
                    if (campRule.type.toLowerCase() == 'dkp') total.dkp += campPoints;
                    else total.ppp += campPoints;
                })

                let message;
                try {
                    message = await interaction.channel.messages.fetch(selections[id].messageId);
                } catch (err) {
                    return await interaction.editReply({ ephemeral: true, content: '', embeds: [new errorEmbed('Error fetching reward log message', err.message)], components: [] });
                }
                embed = new EmbedBuilder()
                    .setTitle(selections[id].event.monster_name)
                    .addFields(
                        ...[
                            { name: 'Members', value: String(eventSignups.filter((a, i, arr) => arr.slice(0, i).find(b => a.player_id.id == b.player_id.id) == null).length) },
                            total.dkp == 0 ? null : { name: 'Total DKP', value: String(total.dkp) },
                            total.ppp == 0 ? null : { name: 'Total PPP', value: String(total.ppp) }
                        ].filter(a => a != null)
                    )
                await message.edit({ embeds: [embed] });

                embed = new EmbedBuilder()
                    .setTitle('Success')
                    .setColor('#00ff00')
                    .setDescription('Signup updated')
                await interaction.editReply({ ephemeral: true, content: '', embeds: [embed], components: [] });
                break;
            }
        }
    },
    async selectHandler({ config, interaction, user, supabase, logChannel }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'signup': {
                let [eventId, id, messageId] = args.slice(3);
                if (id == null) id = interaction.id;
                if (!interaction.deferred) await interaction.deferUpdate();

                if (selections[id] == null) {
                    let { data: event, error } = await supabase.from(config.supabase.tables.events).select('*').eq('event_id', eventId);
                    if (error) return await interaction.editReply({ content: '', embeds: [errorEmbed('Error Fetching Event', error.message)], components: [] });
                    event = event[0];

                    let signup;
                    ({ data: signup, error } = await supabase.from(config.supabase.tables.signups).select('*, player_id (id, username)').eq('signup_id', interaction.values[0]));
                    if (error) return await interaction.editReply({ content: '', embeds: [errorEmbed('Error Fetching Signup', error.message)], components: [] });
                    signup = signup[0];
        
                    selections[id] = {
                        event,
                        signup,
                        messageId
                    }
                }
                let components = [
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId(`editevent-edit-${id}-windows-int`)
                                .setPlaceholder(`Windows${selections[id].signup.windows == null ? '' : `: ${selections[id].signup.windows}`}`)
                                .addOptions(
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('Custom')
                                        .setValue('custom'),
                                    ...new Array(Math.min(selections[id].event.windows || 24, 24)).fill().map((a, i) =>
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel(`${i + 1}`)
                                            .setValue(`${i + 1}`)
                                    )
                                )
                        ),
                    config.roster.placeholderMonsters.includes(selections[id].event.monster_name) ? new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId(`editevent-edit-${id}-placeholders-int`)
                                .setPlaceholder(`Placeholders ${selections[id].signup.placeholders}`)
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
                        ) : null,
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`editevent-toggle-tagged-${id}`)
                                .setStyle(selections[id].signup.tagged == null ? ButtonStyle.Secondary : selections[id].signup.tagged ? ButtonStyle.Success : ButtonStyle.Danger)
                                .setLabel(`Tagged${selections[id].signup.tagged == null ? '' : selections[id].signup.tagged ? ': ✓' : ': ✖'}`),
                            new ButtonBuilder()
                                .setCustomId(`editevent-toggle-killed-${id}`)
                                .setStyle(selections[id].signup.killed == null ? ButtonStyle.Secondary : selections[id].signup.killed ? ButtonStyle.Success : ButtonStyle.Danger)
                                .setLabel(`Killed${selections[id].signup.killed == null ? '' : selections[id].signup.killed ? ': ✓' : ': ✖'}`),
                            new ButtonBuilder()
                                .setCustomId(`editevent-toggle-rage-${id}`)
                                .setStyle(selections[id].signup.rage ? ButtonStyle.Success : ButtonStyle.Danger)
                                .setLabel(`Rage${selections[id].signup.rage ? ': ✓' : ': ✖'}`)
                        ),
                    new ActionRowBuilder()
                    .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`editevent-verify-${id}`)
                                .setStyle(ButtonStyle.Success)
                                .setLabel('✓')
                        )
                ].filter(a => a != null);
                let message = { ephemeral: true, components };
                if (selections[id].screenshot != null) message.content = `https://mrqccdyyotqulqmagkhm.supabase.co/storage/v1/object/public/${config.supabase.buckets.screenshots}/${selections[id].signup.screenshot}`;
                await interaction.editReply(message);
                break;
            }
            case 'edit': {
                let [id, option, type] = args.slice(2);

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please use the edit button again')
                    return await interaction.update({ ephemeral: true, embeds: [embed], components: [], content: '' });
                }

                if (interaction.values[0] == 'custom') {
                    let modal = new ModalBuilder()
                        .setCustomId(`editevent-${id}`)
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
                            selections[id].signup[option] = parseInt(interaction.values[0]);
                            break;
                        }
                        case 'bool': {
                            selections[id].signup[option] = interaction.values[0] == 'true';
                            break;
                        }
                    }
                    interaction.customId = `editevent-signup---${id}-true`;
                    this.selectHandler({ config, interaction, user, supabase, logChannel });
                }
                break;
            }
        }
    },
    async modalHandler({ config, interaction, user, supabase, logChannel }) {
        let args = interaction.customId.split('-');
        let id = args[1];

        if (selections[id] == null) {
            let embed = new EmbedBuilder()
                .setTitle('Error')
                .setColor('#ff0000')
                .setDescription('This message has expired, please use the edit button again')
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
                selections[id].signup[option] = value;
                break;
            }
        }
        
        interaction.customId = `editevent-signup---${id}-true`;
        this.selectHandler({ config, interaction, user, supabase, logChannel });
    }
}