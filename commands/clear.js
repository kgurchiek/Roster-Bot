const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { errorEmbed } = require('../commonFunctions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear'),
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
                    let { error } = await supabase.from(config.supabase.tables.events).update({ windows: monsters[monster].windows + 1 }).eq('event_id', monsters[monster].event);
                    if (error) return await interaction.editReply({ embeds: [errorEmbed('Error updating monster windows', error.message)], components: [] });
                    monsters[monster].lastCleared = new Date();
                    monsters[monster].windows++;

                    let signups;
                    ({ data: signups, error } = await supabase.from(config.supabase.tables.signups).select('*, player_id (*)').eq('event_id', monsters[monster].event).eq('window', monsters[monster].windows));
                    if (error) return await interaction.editReply({ embeds: [errorEmbed('Error fetching event signups', error.message)], components: [] });
                    for (let signup of signups) {
                        let { error } = await supabase.from(config.supabase.tables.signups).update({ active: true }).eq('signup_id', signup.signup_id);
                        if (error) return await interaction.editReply({ embeds: [errorEmbed('Error marking signup as active', error.message)], components: [] });
                        let template = templateList.find(a => a.slot_template_id == signup.slot_template_id);
                        if (template == null) return await interaction.editReply({ embeds: [errorEmbed('Error fetching template', `Couldn't find template with id "${signup.slot_template_id}"`)], components: [] });

                        monsters[monster].signups[template.alliance_number - 1][template.party_number - 1][template.party_slot_number - 1] = {
                            user: signup.player_id,
                            job: signup.assigned_job_id,
                            signupId: signup.signup_id,
                            todGrab: signup.todgrab,
                            alt: signup.alt,
                            tag_only: signup.tag_only
                        }
                    }

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