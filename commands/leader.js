const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leader'),
    async buttonHandler({ config, interaction, user, supabase, monsters, logChannel, jobList }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'monster': {
                let monster = args[2];
                
                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                for (let i = 0; i < monsters[monster].signups.length; i++) {
                    for (let j = 0; j < monsters[monster].signups[i].length; j++) {
                        for (let k = 0; k < monsters[monster].signups[i][j].length; k++) {
                            if (monsters[monster].signups[i][j][k] == null || monsters[monster].signups[i][j][k].user.id != user.id) continue;
                            let job = jobList.find(a => a.job_id == monsters[monster].signups[i][j][k].job);
                            if (job == null) return await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Error fetching job data', `Couldn't find job with id ${monsters[monster].signups[i][j][k].job}`)] });
                            
                            if (monsters[monster].leaders[i][j] != null) {
                                if (monsters[monster].leaders[i][j].id == user.id) {
                                    let embed = new EmbedBuilder()
                                        .setTitle('Warning')
                                        .setColor('#ffff00')
                                        .setDescription('You are already leader of your party, would you like to let someone else be leader?')
                                    let button = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder()
                                                .setCustomId(`leader-remove-${monster}`)
                                                .setLabel('✓')
                                                .setStyle(ButtonStyle.Success)
                                        )
                                    return await interaction.reply({ ephemeral: true, embeds: [embed], components: [button] });
                                } else {
                                    let embed = new EmbedBuilder()
                                        .setTitle('Error')
                                        .setColor('#ff0000')
                                        .setDescription(`${monsters[monster].leaders[i][j].username} is already leader of your party`)
                                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                                }
                            }
                            if (job.role_type == 'Tank') {
                                let embed = new EmbedBuilder()
                                    .setTitle('Error')
                                    .setColor('#ff0000')
                                    .setDescription('Tanks cannot be party leaders')
                                return await interaction.reply({ ephemeral: true, embeds: [embed] });
                            }
                            monsters[monster].leaders[i][j] = user;
                            let { error } = await supabase.from(config.supabase.tables.signups).update({ leader: true }).eq('signup_id', monsters[monster].signups[i][j].find(a => a?.user.id == user.id).signupId);
                            if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error updating signup leader status', error.message)] });
                            await monsters[monster].updateMessage();
                            let embed = new EmbedBuilder()
                                .setTitle('Success')
                                .setColor('#00ff00')
                                .setDescription('You are now the leader of your party')
                            await interaction.reply({ ephemeral: true, embeds: [embed] });
                            embed = new EmbedBuilder().setDescription(`${user.username} is now leader of alliance ${i + 1}, party ${k + 1} of the ${monster} raid.`);
                            return await logChannel.send({ embeds: [embed] });
                        }
                    }
                }
                let embed = new EmbedBuilder()
                    .setTitle('Error')
                    .setColor('#ff0000')
                    .setDescription(`You are not signed up for this raid`)
                return await interaction.reply({ ephemeral: true, embeds: [embed] });
                break;
            }
            case 'remove': {
                let monster = args[2];

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                for (let i = 0; i < monsters[monster].signups.length; i++) {
                    for (let j = 0; j < monsters[monster].signups[i].length; j++) {
                        if (monsters[monster].leaders[i][j]?.id != user.id) continue;
                        monsters[monster].removedLeader[i][j] = user.id;
                        monsters[monster].leaders[i][j] = null;
                        await interaction.deferReply({ ephemeral: true });
                        let { error } = await supabase.from(config.supabase.tables.signups).update({ leader: false }).eq('signup_id', monsters[monster].signups[i][j].find(a => a.user.id == user.id).signupId);
                        if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error updating signup leader status', error.message)] });
                        await monsters[monster].updateMessage();
                        let embed = new EmbedBuilder()
                            .setTitle('Success')
                            .setColor('#00ff00')
                            .setDescription('You are no longer leader of your party')
                        return await interaction.reply({ ephemeral: true, embeds: [embed] });
                    }
                }

                 let embed = new EmbedBuilder()
                    .setTitle('Error')
                    .setColor('#ff0000')
                    .setDescription(`You are not a leader in this raid`)
                return await interaction.reply({ ephemeral: true, embeds: [embed] });
                break;
            }
        }
    }
}