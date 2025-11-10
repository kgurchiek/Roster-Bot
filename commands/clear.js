const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear'),
    async buttonHandler({ interaction, user, supabase, monsters }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'monster':  {
                let monster = args[2];

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.reply({ embeds: [embed] });
                }

                let buttons = [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`clear-confirm-${monster}`)
                                .setLabel('✓')
                                .setStyle(ButtonStyle.Success)
                        )
                ]
                await interaction.reply({ ephemeral: true, content: 'Are you sure you want to clear this raid?', components: buttons });
                break;
            }
            case 'confirm':  {
                let monster = args[2];

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.reply({ embeds: [embed] });
                }
                
                await interaction.deferReply({ ephemeral: true });
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
                    await interaction.editReply({ ephemeral: true, embeds });
                } else {
                    let embed = new EmbedBuilder()
                        .setTitle('Success')
                        .setColor('#00ff00')
                        .setDescription(`The raid has been cleared`)
                    await interaction.editReply({ ephemeral: true, embeds: [embed] });
                }

                await monsters[monster].message.edit({ embeds: [monsters[monster].createEmbed()] });
                break;
            }
        }
    }
}