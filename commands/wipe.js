const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { errorEmbed } = require('../commonFunctions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wipe'),
    async buttonHandler({ config, interaction, supabase, monsters, logChannel, templateList }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'monster':  {
                let monster = args[2];

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                let embed = new EmbedBuilder()
                    .setColor('#ffff00')
                    .setDescription(`Are you sure you want to delete all signups on this window?`)
                let buttons = [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`wipe-confirm-${monster}`)
                                .setLabel('✓')
                                .setStyle(ButtonStyle.Success)
                        )
                ]
                await interaction.reply({ ephemeral: true, embeds: [embed], components: buttons });
                break;
            }
            case 'confirm': {
                let monster = args[2];

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.update({ ephemeral: true, embeds: [embed], components: [] });
                }
                
                await interaction.deferUpdate();
                let { error } = await supabase.from(config.supabase.tables.signups).delete().eq('event_id', monsters[monster].event).eq('window', monsters[monster].windows);
                if (error) return await interaction.editReply({ content: '', embeds: [errorEmbed('Error deleting signups', error.message)], components: [] });

                monsters[monster].signups = Array(monsters[monster].alliances).fill().map(() => Array(monsters[monster].parties).fill().map(() => Array(monsters[monster].slots).fill()));
                await monsters[monster].updateMessage();

                let embed = new EmbedBuilder()
                    .setDescription(`${monster}'s signups have been wiped on window ${monsters[monster].windows}`)
                await logChannel.send({ embeds: [embed] });
                embed.setTitle('Success');
                embed.setColor('#00ff00');
                await interaction.editReply({ ephemeral: true, embeds: [embed], components: [] });

                break;
            }
        }
    }
}