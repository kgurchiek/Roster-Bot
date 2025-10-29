const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');
const config = require('../config.json');

let selections = {};
module.exports = {
    data: new SlashCommandBuilder()
        .setName('quickjoin'),
    async buttonHandler({ interaction, user, supabase, jobList, templateList, monsters }) {
        switch (interaction.customId.split('-')[1]) {
            case 'job': {
                let monster = interaction.customId.split('-')[2];
                selections[interaction.message.id] = {}

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.reply({ embeds: [embed] });
                }

                for (let alliances of monsters[monster].signups) {
                    for (let parties of alliances) {
                        for (let slot of parties) {
                            if (interaction.user.id == slot?.user.id) {
                                let embed = new EmbedBuilder()
                                    .setTitle('Error')
                                    .setColor('#ff0000')
                                    .setDescription('You already signed up for this raid')
                                return await interaction.reply({ ephemeral: true, embeds: [embed] });
                            }
                        }
                    }
                }

                let jobs = [];
                for (let alliance = 1; alliance < config.roster.alliances + 1; alliance++) {
                    for (let party = 1; party < config.roster.parties + 1; party++) {
                        for (let slot = 1; slot < config.roster.slots + 1; slot++) {
                            if (monsters[monster].signups[alliance - 1][party - 1][slot - 1] != null) continue;
                            let template = templateList.find(a => a.monster_name == monster && a.alliance_number == alliance && a.party_number == party && a.party_slot_number == slot).allowed_job_ids;
                            if (template == null) return await interaction.reply({ ephemeral: true, embeds: [errorEmbed(`Error fetching jobs`, `Could not find template for monster "${monster}", alliance ${alliance}, party ${party}, slot ${slot}`)] });
                            template = template.map(a => {
                                let job = jobList.find(b => b.job_id == a);
                                if (job == null) {
                                    console.log(`Error: can't find job id: ${a}`);
                                    return null;
                                }
                                return job;
                            }).filter(a => a != null);
                            jobs = jobs.concat(template);
                        }
                    }
                }
                jobs = jobs.filter((a, i, arr) => !arr.slice(0, i).find(b => b.job_id == a.job_id));
                

                let buttons = [
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setPlaceholder('Select Job')
                                .setCustomId(`quickjoin-selectjob-${interaction.message.id}`)
                                .addOptions(
                                    ...jobs.map(a => 
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel(a.job_name)
                                            .setValue(`${a.job_id}`)
                                    )
                                )
                        ),
                     new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`quickjoin-confirm-${monster}-${interaction.message.id}`)
                                .setLabel('✓')
                                .setStyle(ButtonStyle.Success)
                        )
                ]
                await interaction.reply({ ephemeral: true, components: buttons });
                break;
            }
            case 'confirm': {
                let [monster, id] = interaction.customId.split('-').slice(2);
                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                    .setTitle('Error')
                    .setColor('#ff0000')
                    .setDescription(`${monster} is not active`)
                    return await interaction.reply({ embeds: [embed] });
                }

                for (let alliances of monsters[monster].signups) {
                    for (let parties of alliances) {
                        for (let slot of parties) {
                            if (interaction.user.id == slot?.user.id) {
                                let embed = new EmbedBuilder()
                                    .setTitle('Error')
                                    .setColor('#ff0000')
                                    .setDescription('You already signed up for this raid')
                                return await interaction.reply({ ephemeral: true, embeds: [embed] });
                            }
                        }
                    }
                }
                
                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please click the sign up button again')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                
                let job = selections[id].job;
                if (job == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('Select the job you wish to sign up for')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                let emptySlot;
                for (let alliance = 1; emptySlot == null && alliance < config.roster.alliances + 1; alliance++) {
                    for (let party = 1; emptySlot == null && party < config.roster.parties + 1; party++) {
                        for (let slot = 1; emptySlot == null && slot < config.roster.slots + 1; slot++) {
                            if (monsters[monster].signups[alliance - 1][party - 1][slot - 1] != null) continue;
                            let template = templateList.find(a => a.monster_name == monster && a.alliance_number == alliance && a.party_number == party && a.party_slot_number == slot);
                            if (template == null) return await interaction.reply({ ephemeral: true, embeds: [errorEmbed(`Error fetching jobs`, `Could not find template for monster "${monster}", alliance ${alliance}, party ${party}, slot ${slot}`)] });
                            let templateId = template.slot_template_id;
                            template = template.allowed_job_ids;
                            if (template.find(a => a == job)) {
                                emptySlot = {
                                    alliance,
                                    party,
                                    slot,
                                    templateId
                                };
                            }
                        }
                    }
                }
                if (emptySlot == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('No slots are available for the selected job')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                ({ alliance, party, slot, templateId } = emptySlot);
                if (monsters[monster].signups[alliance - 1][party - 1][slot - 1] != null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`Slot already filled by ${monsters[monster].signups[alliance - 1][party - 1][slot - 1].user.username}`)
                    return await interaction.reply({ embeds: [embed] });
                }

                await interaction.deferReply({ ephemeral: true });
                let { error } = await supabase.from(config.supabase.tables.signups).insert({
                    event_id: monsters[monster].event,
                    slot_template_id: templateId,
                    player_id: user.id,
                    assigned_job_id: job
                });
                if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error updating database', error.message)] });
                
                monsters[monster].signups[alliance - 1][party - 1][slot - 1] = {
                    user,
                    job
                }
                delete selections[id];

                let embed = new EmbedBuilder()
                    .setTitle('Success')
                    .setColor('#00ff00')
                    .setDescription(`You signed up for alliance ${alliance}, party ${party}, slot ${slot}`)
                await interaction.editReply({ ephemeral: true, embeds: [embed] });
                await monsters[monster].message.edit({ embeds: [monsters[monster].createEmbed()] });
                break;
            }
        }
    },
    async selectHandler({ interaction }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'selectjob': {
                if (selections[args[2]] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please click the sign up button again')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                interaction.deferUpdate();
                selections[args[2]].job = interaction.values[0];
                break;
            }
        }
    }
}