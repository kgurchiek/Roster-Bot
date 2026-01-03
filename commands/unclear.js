const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unclear'),
    async buttonHandler({ config, interaction, user, supabase, monsters, logChannel }) {
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
                    .setDescription(`Are you sure you want to revert to the previous window (${(monsters[monster].windows || 0) - 1})?`)
                let buttons = [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`unclear-confirm-${monster}`)
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

                monsters[monster].lastCleared = new Date();
                monsters[monster].clears--;
                monsters[monster].windows--;
                await monsters[monster].updateMessage();
                let embed = new EmbedBuilder()
                    .setDescription(`${monster} has been rolled back to window ${monsters[monster].windows}`)
                await logChannel.send({ embeds: [embed] });
                embed.setTitle('Success');
                embed.setColor('#00ff00');
                await interaction.reply({ ephemeral: true, embeds: [embed], components: [] });
                break;
            }
        }
    }
}