const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { errorEmbed } = require('../commonFunctions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('revert'),
    async buttonHandler({ config, interaction, user, supabase, monsters, logChannel, templateList }) {
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
                                .setCustomId(`revert-confirm-${monster}`)
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
                await interaction.deferUpdate();
                let { data: signups, error } = await supabase.from(config.supabase.tables.signups).select('*, player_id (*)').eq('event_id', monsters[monster].event).eq('window', monsters[monster].windows);
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

                await monsters[monster].updateMessage();
                let embed = new EmbedBuilder()
                    .setDescription(`${monster} has been rolled back to window ${monsters[monster].windows}`)
                await logChannel.send({ embeds: [embed] });
                embed.setTitle('Success');
                embed.setColor('#00ff00');
                await interaction.editReply({ ephemeral: true, embeds: [embed], components: [] });
                break;
            }
        }
    }
}