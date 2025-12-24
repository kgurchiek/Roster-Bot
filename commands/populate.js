const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');

let selections = {};
module.exports = {
    data: new SlashCommandBuilder()
        .setName('populate'),
    async buttonHandler({ config, interaction, supabase, groupList, monsters, logChannel }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'monster': {
                let monster = args[2];
                selections[interaction.id] = {};

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                
                if (monsters[monster].data.max_windows == 1) selections[interaction.id].windows = 1;

                if (monsters[monster].group == null) {
                    interaction.customId = `populate-confirm-${monster}`;
                    return this.buttonHandler({ config, interaction, supabase, groupList, monsters, logChannel });
                }

                let components = [
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setPlaceholder('Which monster spawned?')
                                .setCustomId(`populate-monster-${monster}`)
                                .addOptions(
                                    ...(monsters[monster].group.includes('Adamantoise') ? [
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('Adamantoise_PPP')
                                            .setValue('Adamantoise_PPP')
                                    ] : []),
                                    ...monsters[monster].group.map(a =>
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel(a)
                                            .setValue(a)
                                    )
                                )
                    )
                ]
                await interaction.reply({ ephemeral: true, components });
                break;
            }
            case 'confirm': {
                let monster = args[2];
                selections[interaction.id] = {};
                if (monsters[monster].data.max_windows == 1) selections[interaction.id].windows = 1;

                if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });
                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.editReply({ ephemeral: true, embeds: [embed], components: [] });
                }

                let buttons = [
                    (monsters[monster].placeholders != null || monsters[monster].data.max_windows == null || monsters[monster].data.max_windows == 1 || monsters[monster].data.max_windows >= 25) ? null : new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setPlaceholder('Windows')
                                .setCustomId(`populate-windows-${interaction.id}`)
                                .addOptions(
                                    ...Array(monsters[monster].data.max_windows).fill().map((a, i) => 
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel(`${i + 1}`)
                                            .setValue(`${i + 1}`)
                                    )
                                )
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setPlaceholder(`Which group killed ${monster}?`)
                                .setCustomId(`populate-group-${interaction.id}`)
                                .addOptions(
                                    ...groupList.map(a => 
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel(a.group_name)
                                            .setValue(a.group_name)
                                    )
                                )
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`populate-confirm2-${monster}-${interaction.id}`)
                                .setLabel('✓')
                                .setStyle(ButtonStyle.Success)
                        )
                ].filter(a => a != null)
                await interaction.editReply({ ephemeral: true, embeds: [], components: buttons });
                break;
            }
            case 'confirm2':  {
                let [monster, id] = args.slice(2);

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.update({ ephemeral: true, embeds: [embed], components: [] });
                }

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please click the sign up button again')
                    return await interaction.update({ ephemeral: true, embeds: [embed], components: [] });
                }
                if (selections[id].group == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('Please select the group that killed the monster')
                    return await interaction.update({ ephemeral: true, embeds: [embed], components: [] });
                }

                if (monsters[monster].placeholders == null) {
                    if (monsters[monster].data.max_windows == null || monsters[monster].data.max_windows >= 25) {
                        let modal = new ModalBuilder()
                            .setCustomId(`populate-${monster}-${id}-${monsters[monster].windows}`)
                            .setTitle(`Populate ${monster} Points`)
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
                    }

                    if (selections[id].windows == null) {
                        let embed = new EmbedBuilder()
                            .setTitle('Error')
                            .setColor('#ff0000')
                            .setDescription('Please select the number of windows')
                        return await interaction.update({ ephemeral: true, embeds: [embed], components: [] });
                    }
                }
                
                interaction.customId = `populate-confirm3-${monster}-${id}`;
                this.buttonHandler({ config, interaction, supabase, groupList, monsters, logChannel });
                break;
            }
            case 'confirm3': {
                let [monster, id] = args.slice(2);

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.update({ ephemeral: true, embeds: [embed], components: [] });
                }

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please click the sign up button again')
                    return await interaction.update({ ephemeral: true, embeds: [embed], components: [] });
                }

                if (selections[id].group == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('Please select the group that killed the monster')
                    return await interaction.update({ ephemeral: true, embeds: [embed], components: [] });
                }
                if (monsters[monster].placeholders == null && selections[id].windows == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('Please select the number of windows')
                    return await interaction.update({ ephemeral: true, embeds: [embed], components: [] });
                }

                await interaction.deferUpdate({ ephemeral: true });
                let { error } = await supabase.from(config.supabase.tables.events).update({ windows: selections[id].windows, killed_by: selections[id].group, active: false }).eq('event_id', monsters[monster].event);
                if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error updating killer', error.message)], components: [] });
                monsters[monster].windows = selections[id].windows;
                monsters[monster].killer = selections[id].group;

                try {
                    let { error } = (await monsters[monster].close()) || {};
                    if (error) throw new Error(error.message);

                    let embed = new EmbedBuilder()
                        .setTitle('Success')
                        .setColor('#00ff00')
                        .setDescription(`The raid has been closed`)
                    await interaction.editReply({ ephemeral: true, embeds: [embed], components: [] });
                    embed = new EmbedBuilder().setDescription(`The ${monster} raid has been closed`);
                    await logChannel.send({ embeds: [embed] });
                } catch (err) {
                    console.log(err);
                    return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error closing monster', err.message)], components: [] });
                }

                break;
            }
        }
    },
    async selectHandler({ config, interaction, supabase, monsterList, groupList, monsters, logChannel }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'monster': {
                let monster = args[2];
                await interaction.deferUpdate();

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.editReply({ ephemeral: true, embeds: [embed], components: [] });
                }

                let { error } = await supabase.from(config.supabase.tables.events).update({ monster_name: interaction.values[0] }).eq('event_id', monsters[monster].event);
                if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error updating event monster name', error.message)], components: [] });
                monsters[monster].name = interaction.values[0];
                let data = monsterList.find(a => a.monster_name == interaction.values[0]);
                if (data == null) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error fetching monster data', `Could not find data for ${interaction.values[0]}`)], components: [] });
                monsters[monster].updateMessage();
                monsters[interaction.values[0]] = monsters[monster];
                delete monsters[monster];
                interaction.customId = `populate-confirm-${interaction.values[0]}-true`;
                this.buttonHandler({ config, interaction, supabase, groupList, monsters, logChannel });
                break;
            }
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
            case 'group': {
                let id = args[2];

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please click the sign up button again')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                interaction.deferUpdate();
                selections[id].group = interaction.values[0];
                break;
            }
        }
    },
    async modalHandler({ config, interaction, supabase, groupList, monsters, logChannel }) {        
        let args = interaction.customId.split('-');
        let [monster, id, maxWindows] = args.slice(1);
        maxWindows = parseInt(maxWindows);

        if (monsters[monster] == null) {
            let embed = new EmbedBuilder()
                .setTitle('Error')
                .setColor('#ff0000')
                .setDescription(`${monster} is not active`)
            return await interaction.reply({ ephemeral: true, embeds: [embed] });
        }

        let windows = parseInt(interaction.fields.getTextInputValue('windows'));
        if (isNaN(windows) || windows < 0 || windows > maxWindows) {
            let embed = new EmbedBuilder()
                .setTitle('Error')
                .setColor('#ff0000')
                .setDescription(`Please enter a valid number of windows${maxWindows == Infinity ? '' : ` (max: ${maxWindows})`}`)
            return await interaction.reply({ ephemeral: true, embeds: [embed] });
        }
        selections[id].windows = windows;

        interaction.customId = `populate-confirm3-${monster}-${id}`;
        this.buttonHandler({ config, interaction, supabase, groupList, monsters, logChannel });
    }
}