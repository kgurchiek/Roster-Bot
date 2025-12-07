const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause'),
    async buttonHandler({ interaction, user, monsters, logChannel }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'pause': {
                let monster = args[2];

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                if (!user.staff) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This action can only be performed by staff`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                monsters[monster].paused = true;
                await interaction.deferUpdate();
                let embed = new EmbedBuilder().setDescription(`The ${monster} raid has been paused.`);
                await logChannel.send({ embeds: [embed] });
                await monsters[monster].updateMessage();
                break;
            }
            case 'unpause': {
                let monster = args[2];

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                if (!user.staff) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This action can only be performed by staff`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                monsters[monster].paused = false;
                await interaction.deferUpdate();
                await monsters[monster].updateMessage();
                let embed = new EmbedBuilder().setDescription(`The ${monster} raid has been unpaused.`);
                await logChannel.send({ embeds: [embed] });
                break;
            }
        }
    }
}