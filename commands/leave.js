const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');
const config = require('../config.json');

let selections = {};
module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave'),
    async buttonHandler({ interaction, user, supabase, monsters }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'monster':  {
                let monster = args[2];
                selections[interaction.id] = {};

                if (monster == 'Tiamat') {
                    interaction.customId = `leave-confirm-${monster}-${interaction.id}`;
                    return this.buttonHandler({ interaction, user, supabase, monsters });
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

                if (monsters[monster].data.max_windows == null || monsters[monster].data.max_windows >= 25) {
                    let modal = new ModalBuilder()
                        .setCustomId(`leave-${monster}-${interaction.id}-${monsters[monster].data.max_windows}`)
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
                                .setPlaceholder('Select Windows')
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
                                .setCustomId(`leave-confirm-${monster}-${interaction.id}`)
                                .setLabel('✓')
                                .setStyle(ButtonStyle.Success)
                        )
                ]
                await interaction.reply({ ephemeral: true, content: 'How many windows have you camped?', components: buttons });
                break;
            }
            case 'confirm':  {
                let [monster, id] = args.slice(2);

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                if (monster == 'Tiamat') selections[id] = {}
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

                await interaction.deferReply({ ephemeral: true });

                if (['Tiamat', 'Lord of Onzozo'].includes(monster) || monsters[monster].data.max_windows == 1) {
                    let { error } = await supabase.from(config.supabase.tables.signups).delete().eq('event_id', monsters[monster].event).eq('player_id', user.id).eq('active', true);
                    if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error updating database', error.message)] });
                } else {
                    let { error } = await supabase.from(config.supabase.tables.signups).update(Object.assign({ active: false }, selections[id].windows == null ? {} : { windows: selections[id].windows })).eq('event_id', monsters[monster].event).eq('player_id', user.id).eq('active', true);
                    if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error updating database', error.message)] });
                }

                monsters[monster].signups[alliance][party][slot] = null;
                delete selections[id];

                let embed = new EmbedBuilder()
                    .setTitle('Success')
                    .setColor('#00ff00')
                    .setDescription(`You let the raid`)
                await interaction.editReply({ ephemeral: true, embeds: [embed] });
                await monsters[monster].message.edit({ embeds: monsters[monster].createEmbeds() });
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
        }
    },
    async modalHandler({ interaction, supabase, groupList, monsters }) {        
        let args = interaction.customId.split('-');
        let [monster, id, maxWindows] = args.slice(1);
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

        interaction.customId = `leave-confirm-${monster}-${id}`;
        this.buttonHandler({ interaction, supabase, groupList, monsters });
    }
}