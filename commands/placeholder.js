const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');
const config = require('../config.json');

let selections = {};
module.exports = {
    data: new SlashCommandBuilder()
        .setName('placeholder'),
    async buttonHandler({ interaction, user, supabase, monsters }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'increment': {
                let monster = args[2];
                selections[interaction.id] = { count: 1 };

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                let signupId = monsters[monster].signups.filter(alliance => alliance.filter(party => party.filter(slot => slot?.user.id == user.id)))[0][0][0].signupId;
                if (signupId == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('You are not signed up for this raid')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                interaction.customId = `placeholder-confirm-${monster}-${interaction.id}-${signupId}`;
                this.buttonHandler({ interaction, user, supabase, monsters })
                break;
            }
            case 'enter': {
                let monster = args[2];
                selections[interaction.id] = {};

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                let signupId = monsters[monster].signups.filter(alliance => alliance.filter(party => party.filter(slot => slot?.user.id == user.id)))[0][0][0].signupId;
                if (signupId == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('You are not signed up for this raid')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }


                let buttons = [
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setPlaceholder('How many placeholders did you defeat?')
                                .setCustomId(`placeholder-count-${interaction.id}`)
                                .addOptions(
                                    ...Array(25).fill().map((a, i) => 
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel(`${i + 1}`)
                                            .setValue(`${i + 1}`)
                                    )
                                )
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`placeholder-confirm-${monster}-${interaction.id}-${signupId}`)
                                .setLabel('✓')
                                .setStyle(ButtonStyle.Success)
                        )
                ].filter(a => a != null)
                await interaction.reply({ ephemeral: true, components: buttons });
                break;
            }
            case 'confirm':  {
                let [monster, id, signupId] = args.slice(2);

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please click the sign up button again')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                if (selections[id].count == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('Please select the number of placeholders you defeated')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                
                await interaction.deferReply({ ephemeral: true });
                if (monsters[monster].placeholders[user.username] == null) monsters[monster].placeholders[user.username] = 0;
                let { error } = await supabase.from(config.supabase.tables.signups).update({
                    placeholders: monsters[monster].placeholders[user.username] + selections[id].count
                }).eq('signup_id', signupId);
                if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error updating placeholders', error.message)] });
                monsters[monster].placeholders[user.username] += selections[id].count;

                await monsters[monster].message.edit({ embeds: monsters[monster].createEmbeds() });
                break;
            }
        }
    },
    async selectHandler({ interaction }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'count': {
                let id = args[2];

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please click the sign up button again')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                interaction.deferUpdate();
                selections[id].count = parseInt(interaction.values[0]);
                break;
            }
        }
    }
}