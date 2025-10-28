const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');
const config = require('../config.json');

let selections = {};
module.exports = {
    data: new SlashCommandBuilder()
        .setName('signup'),
    async buttonHandler({ interaction, user, supabase, jobList, templateList, monsters }) {
        switch (interaction.customId.split('-')[1]) {
            case 'select': {
                let monster = interaction.customId.split('-')[2];
                if (monster == null) return await interaction.reply({ ephemeral: true, embeds: [errorEmbed(`Error fetching ${monster}`, `Could not find data for monster "${monster}"`)] });
                
                let buttons = [
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId(`signup-selectslot-alliance`)
                                .setPlaceholder('Select Alliance')
                                .addOptions(
                                    ...Array(config.roster.alliances).fill().map((a, i) =>
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel(`${i + 1}`)
                                            .setValue(`${i + 1}`)
                                    )
                                )
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId(`signup-selectslot-party`)
                                .setPlaceholder('Select Party')
                                .addOptions(
                                    ...Array(config.roster.parties).fill().map((a, i) => 
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel(`${i + 1}`)
                                            .setValue(`${i + 1}`)
                                    )
                                )
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setPlaceholder('Select Slot')
                                .setCustomId(`signup-selectslot-slot`)
                                .addOptions(
                                    ...Array(config.roster.slots).fill().map((a, i) => 
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel(`${i + 1}`)
                                            .setValue(`${i + 1}`)
                                    )
                                )
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`signup-job-${monster}`)
                                .setLabel('✓')
                                .setStyle(ButtonStyle.Success)
                        )
                ]

                await interaction.reply({ ephemeral: true, components: buttons });
                break;
            }
            case 'job': {
                let monster = interaction.customId.split('-')[2];

                if (selections[interaction.message.id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please click the sign up button again')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                let { alliance, party, slot } = selections[interaction.message.id];
                if (alliance == null) return await interaction.reply({ ephemeral: true, embeds: [new EmbedBuilder().setTitle('Error').setColor('#ff0000').setDescription('Select which alliance you wish to join')] });
                if (party == null) return await interaction.reply({ ephemeral: true, embeds: [new EmbedBuilder().setTitle('Error').setColor('#ff0000').setDescription('Select which party you wish to join')] });
                if (slot == null) return await interaction.reply({ ephemeral: true, embeds: [new EmbedBuilder().setTitle('Error').setColor('#ff0000').setDescription('Select which slot you wish to join')] });

                if (monsters[monster].signups[alliance - 1][party - 1][slot - 1] != null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`Slot already filled by ${monsters[monster].signups[alliance - 1][party - 1][slot - 1].user.username}`)
                    return await interaction.reply({ embeds: [embed] });
                }

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not accepting signups`)
                    return await interaction.reply({ embeds: [embed] });
                }
                let template = templateList.find(a => a.monster_name == monster && a.alliance_number == alliance && a.party_number == party && a.party_slot_number == slot);
                let templateId = template.slot_template_id;
                template = template.allowed_job_ids;
                if (template == null) return await interaction.reply({ ephemeral: true, embeds: [errorEmbed(`Error fetching jobs`, `Could not find template for monster "${monster}", alliance ${alliance}, party ${party}, slot ${slot}`)] });
                template = template.map(a => {
                    let job = jobList.find(b => b.job_id == a);
                    if (job == null) {
                        console.log(`Error: can't find job id: ${a}`);
                        return null;
                    }
                    return job;
                }).filter(a => a != null);

                let buttons = [
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setPlaceholder('Select Job')
                                .setCustomId(`signup-selectjob-${interaction.message.id}`)
                                .addOptions(
                                    ...template.map(a => 
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel(a.job_name)
                                            .setValue(`${a.job_id}`)
                                    )
                                )
                        ),
                     new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`signup-confirm-${monster}-${interaction.message.id}-${templateId}`)
                                .setLabel('✓')
                                .setStyle(ButtonStyle.Success)
                        )
                ]
                await interaction.reply({ ephemeral: true, components: buttons });
                break;
            }
            case 'confirm': {
                let [monster, id, templateId] = interaction.customId.split('-').slice(2);
                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                    .setTitle('Error')
                    .setColor('#ff0000')
                    .setDescription(`${monster} is not active`)
                    return await interaction.reply({ embeds: [embed] });
                }
                
                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please click the sign up button again')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                let { alliance, party, slot, job } = selections[id];
                if (monsters[monster].signups[alliance - 1][party - 1][slot - 1] != null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`Slot already filled by ${monsters[monster].signups[alliance - 1][party - 1][slot - 1].user.username}`)
                    return await interaction.reply({ embeds: [embed] });
                }
                if (job == null) return await interaction.reply({ ephemeral: true, embeds: [new EmbedBuilder().setTitle('Error').setColor('#ff0000').setDescription('Select the job you wish to sign up for')] });

                let { error } = await supabase.from(config.supabase.tables.signups).insert({
                    event_id: monsters[monster].event,
                    slot_template_id: templateId,
                    player_id: user.id,
                    assigned_job_id: job
                });
                if (error) return await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Error updating database', error.message)] });
                
                monsters[monster].signups[alliance - 1][party - 1][slot - 1] = {
                    user,
                    job
                }
                delete selections[id];

                let embed = new EmbedBuilder()
                    .setTitle('Success')
                    .setColor('#00ff00')
                    .setDescription(`You signed up for alliance ${alliance}, party ${party}, slot ${slot}`)
                await interaction.reply({ ephemeral: true, embeds: [embed] });
                await monsters[monster].message.edit({ embeds: [monsters[monster].createEmbed()] });
                break;
            }
        }
    },
    async selectHandler({ interaction }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'selectslot': {
                interaction.deferUpdate();
                if (selections[interaction.message.id] == null) selections[interaction.message.id] = {};
                selections[interaction.message.id][args[2]] = parseInt(interaction.values[0]);
                break;
            }
            case 'selectjob': {
                interaction.deferUpdate();
                selections[args[2]].job = interaction.values[0];
                break;
            }
        }
    }
}