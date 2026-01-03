const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear'),
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
                    .setDescription('Are you sure you want to clear this raid?')
                let buttons = [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`clear-confirm-${monster}`)
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
                let promises = [];
                for (let alliance = 0; alliance < monsters[monster].signups.length; alliance++) {
                    for (let party = 0; party < monsters[monster].signups[alliance].length; party++) {
                        for (let slot = 0; slot < monsters[monster].signups[alliance][party].length; slot++) {
                            if (monsters[monster].signups[alliance][party][slot] == null) continue;
                            promises.push(new Promise(async (res, rej) => {
                                let { error } = await supabase.from(config.supabase.tables.signups).update({ active: false }).eq('event_id', monsters[monster].event).eq('player_id', monsters[monster].signups[alliance][party][slot].user.id);
                                if (error) res({ error, user: monsters[monster].signups[alliance][party][slot].user });
                                else {
                                    monsters[monster].signups[alliance][party][slot] = null;
                                    res();
                                }
                            }))
                        }
                    }
                }
                let errors = (await Promise.all(promises)).filter(a => a != undefined);

                if (errors.length > 0) {
                    let embeds = errors.slice(0, 10).map(a => 
                            new EmbedBuilder()
                                .setTitle(`Error clearing ${a.user.username}`)
                                .setColor('#ff0000')
                                .setDescription(`${a.error.message}`)
                        )
                    await interaction.editReply({ ephemeral: true, embeds, components: [] });
                } else {
                    monsters[monster].lastCleared = new Date();
                    monsters[monster].clears++;
                    monsters[monster].windows++;
                    let embed = new EmbedBuilder()
                        .setDescription(`${monster} has been cleared to the next window`)
                    await logChannel.send({ embeds: [embed] });
                    embed.setTitle('Success');
                    embed.setColor('#00ff00');
                    await interaction.editReply({ ephemeral: true, embeds: [embed], components: [] });
                }

                await monsters[monster].updateMessage();
                break;
            }
        }
    }
}