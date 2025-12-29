const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');

let selections = {};
module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave'),
    async buttonHandler({ config, interaction, user, supabase, userList, monsters, logChannel }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'monster':  {
                let [monster, userId] = args.slice(2);
                if (userId == null) userId = user.id;
                else user = userList.find(a => a.id == userId);
                selections[interaction.id] = {};

                if (monster == 'Tiamat') {
                    interaction.customId = `leave-confirm-${monster}-${interaction.id}-${userId}`;
                    return this.buttonHandler({ config, interaction, user, supabase, userList, monsters, logChannel });
                }

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                
                let joined = false;
                for (let i = 0; !joined && i < monsters[monster].signups.length; i++) {
                    for (let j = 0; !joined && j < monsters[monster].signups[i].length; j++) {
                        for (let k = 0; !joined && k < monsters[monster].signups[i][j].length; k++) {
                            if (user.id == monsters[monster].signups[i][j][k]?.user.id) joined = true;
                        }
                    }
                }
                if (!joined) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('You are not signed up for this raid')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                let message;
                if (monsters[monster].placeholders == null && monsters[monster].name != 'Tiamat') {
                    if (monsters[monster].data.max_windows == null || monsters[monster].data.max_windows >= 25) {
                        let modal = new ModalBuilder()
                            .setCustomId(`leave-windows-${monster}-${interaction.id}-${monsters[monster].data.max_windows}-${userId}`)
                            .setTitle(`Leave ${monster} Raid`)
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

                    let buttons = [
                        new ActionRowBuilder()
                            .addComponents(
                                new StringSelectMenuBuilder()
                                    .setPlaceholder('How many windows did you camp?')
                                    .setCustomId(`leave-windows-${interaction.id}`)
                                    .addOptions(
                                        ...Array(8).fill().map((a, i) => 
                                            new StringSelectMenuOptionBuilder()
                                                .setLabel(`${i}`)
                                                .setValue(`${i}`)
                                        )
                                    )
                            ),
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`leave-confirm-${monster}-${interaction.id}-${userId}`)
                                    .setLabel('✓')
                                    .setStyle(ButtonStyle.Success)
                            )
                    ];
                    message = { ephemeral: true, components: buttons };
                } else {
                    let embed = new EmbedBuilder()
                        .setTitle('Warning')
                        .setColor('#ffff00')
                        .setDescription(`Are you sure you want to leave the ${monster} raid?`)
                    buttons = [
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`leave-confirm-${monster}-${interaction.id}-${userId}`)
                                    .setLabel('✓')
                                    .setStyle(ButtonStyle.Success)
                            )
                    ]
                    message = { ephemeral: true, embeds: [embed], components: buttons };
                }
                await interaction.reply(message);
                break;
            }
            case 'confirm':  {
                let [monster, id, userId] = args.slice(2);
                user = userList.find(a => a.id == userId);

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                if (monster == 'Tiamat' || monsters[monster].placeholders != null) selections[id] = {};
                else {
                    if (selections[id] == null) {
                        let embed = new EmbedBuilder()
                            .setTitle('Error')
                            .setColor('#ff0000')
                            .setDescription('This message has expired, please click the sign up button again')
                        return await interaction.reply({ ephemeral: true, embeds: [embed] });
                    }
                    if (selections[id].windows == null) {
                        let embed = new EmbedBuilder()
                            .setTitle('Error')
                            .setColor('#ff0000')
                            .setDescription('Please select how many windows you camped')
                        return await interaction.reply({ ephemeral: true, embeds: [embed] });
                    }
                }
                
                let alliance;
                let party;
                let slot;
                for (let i = 0; alliance == null && i < monsters[monster].signups.length; i++) {
                    for (let j = 0; party == null && j < monsters[monster].signups[i].length; j++) {
                        for (let k = 0; slot == null && k < monsters[monster].signups[i][j].length; k++) {
                            if (user.id == monsters[monster].signups[i][j][k]?.user.id) {
                                alliance = i;
                                party = j;
                                slot = k;
                            }
                        }
                    }
                }
                if (alliance == null) {
                    console.log(monsters[monster].signups)
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('You are not signed up for this raid')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                if (monster == 'Tiamat' || monsters[monster].placeholders != null || monsters[monster].data.max_windows == 1) {
                    let { error } = await supabase.from(config.supabase.tables.signups).delete().eq('event_id', monsters[monster].event).eq('player_id', user.id).eq('active', true);
                    if (error) return await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Error updating database', error.message)] });
                } else {
                    let { error } = await supabase.from(config.supabase.tables.signups).update(Object.assign({ active: false }, selections[id].windows == null ? {} : { windows: selections[id].windows })).eq('event_id', monsters[monster].event).eq('player_id', user.id).eq('active', true);
                    if (error) return await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Error updating database', error.message)] });
                }

                monsters[monster].signups[alliance][party][slot] = null;
                delete selections[id];

                await interaction.update({ content: '​', embeds: [], components: [] });
                let embed = new EmbedBuilder().setDescription(`${user.username} has left the ${monster} raid`);
                await logChannel.send({ embeds: [embed] });
                await monsters[monster].updateMessage();
                await monsters[monster].updateLeaders();
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
        }
    },
    async modalHandler({ config, interaction, user, supabase, userList, monsters, logChannel }) {        
        let args = interaction.customId.split('-');
        switch(args[1]) {
            case 'windows': {
                let [monster, id, maxWindows, userId] = args.slice(2);
                maxWindows = parseInt(maxWindows) || Infinity;

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

                interaction.customId = `leave-confirm-${monster}-${id}-${userId}`;
                this.buttonHandler({ config, interaction, user, supabase, userList, monsters, logChannel });
            }
        }
    }
}