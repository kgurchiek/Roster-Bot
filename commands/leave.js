const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave'),
    async buttonHandler({ interaction, user, supabase, jobList, templateList, monsters }) {
        switch (interaction.customId.split('-')[1]) {
            case 'monster':  {
                let monster = interaction.customId.split('-')[2];

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.reply({ embeds: [embed] });
                }
                
                let joined = false;
                for (let i = 0; !joined && i < monsters[monster].signups.length; i++) {
                    for (let j = 0; j < !joined && monsters[monster].signups[i].length; j++) {
                        for (let k = 0; k < !joined && monsters[monster].signups[i][j].length; k++) {
                            if (user.id == monsters[monster].signups[i][j][k]?.user.id) joined = true;
                        }
                    }
                }
                if (!joined) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('You are not signed up for this raid')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                let button = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`leave-confirm-${monster}`)
                            .setLabel('✓')
                            .setStyle(ButtonStyle.Success)
                    )
                await interaction.reply({ ephemeral: true, content: 'Are you sure you want to leave this raid?', components: [button] });
                break;
            }
            case 'confirm':  {
                let monster = interaction.customId.split('-')[2];

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.reply({ embeds: [embed] });
                }
                
                let alliance;
                let party;
                let slot;
                for (let i = 0; alliance == null && i < monsters[monster].signups.length; i++) {
                    for (let j = 0; party == null && monsters[monster].signups[i].length; j++) {
                        for (let k = 0; slot == null && monsters[monster].signups[i][j].length; k++) {
                            if (user.id == monsters[monster].signups[i][j][k]?.user.id) {
                                alliance = i;
                                party = j;
                                slot = k;
                            }
                        }
                    }
                }
                if (alliance == null) {
                    console.log(monsters[monster].signups)
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('You are not signed up for this raid')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                await interaction.deferReply({ ephemeral: true });
                let { error } = await supabase.from(config.supabase.tables.signups).delete().eq('event_id', monsters[monster].event).eq('player_id', user.id);
                if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error updating database', error.message)] });

                monsters[monster].signups[alliance][party][slot] = null;

                let embed = new EmbedBuilder()
                    .setTitle('Success')
                    .setColor('#00ff00')
                    .setDescription(`You let the raid`)
                await interaction.editReply({ ephemeral: true, embeds: [embed] });
                await monsters[monster].message.edit({ embeds: [monsters[monster].createEmbed()] });
                break;
            }
        }
    }
}