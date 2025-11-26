const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resolve'),
    async buttonHandler({ interaction, supabase, archive }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'monster': {
                let event = args[2];
                
                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has already been closed`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                let unverified = archive[event].data.signups.filter(a => !a.verified).length;
                if (unverified > 0) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${unverified} user${unverified == 1 ? '' : 's'} have not been verified yet`)
                    await interaction.reply({ ephemeral: true, embeds: [embed] });
                    await archive[event].message.edit({ embeds: archive[event].createEmbeds(), components: archive[event].createButtons() });
                    return
                }

                let embed = new EmbedBuilder()
                    .setColor('#ffff00')
                    .setDescription('Are you sure you want to verify this raid?')
                let button = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`resolve-confirm-${event}`)
                            .setStyle(ButtonStyle.Success)
                            .setLabel('✓')
                    )
                await interaction.reply({ ephemeral: true, embeds: [embed], components: [button] });
                break;
            }
            case 'confirm': {
                let [event] = args.slice(2);
                
                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has been closed`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                let unverified = archive[event].data.signups.filter(a => !a.verified).length;
                if (unverified > 0) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${unverified} user${unverified == 1 ? '' : 's'} have not been verified yet`)
                    await interaction.reply({ ephemeral: true, embeds: [embed] });
                    await archive[event].message.edit({ embeds: archive[event].createEmbeds(), components: archive[event].createButtons() });
                    return
                }
                
                await interaction.deferReply({ ephemeral: true });
                let { error } = await supabase.from(config.supabase.tables.events).update({ verified: true }).eq('event_id', event);
                if (error) return await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Error updating signup', error.message)] });
                archive[event].verified = true;
                await archive[event].message.edit({ embeds: archive[event].createEmbeds(), components: archive[event].createButtons() });
                delete archive[event];

                let embed = new EmbedBuilder()
                    .setTitle('Success')
                    .setColor('#00ff00')
                    .setDescription('Raid verified')
                await interaction.editReply({ ephemeral: true, embeds: [embed] });
                break;
            }
        }
    }
}