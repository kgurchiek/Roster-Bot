const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');
const config = require('../config.json');

let selections = {};
module.exports = {
    data: new SlashCommandBuilder()
        .setName('quickjoin'),
    async buttonHandler({ interaction, user, supabase, userList, jobList, templateList, monsters }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'user': {
                let monster = args[2];

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                let modal = new ModalBuilder()
                    .setCustomId(`quickjoin-user-${monster}`)
                    .setTitle(`Add User`)
                    .addComponents(
                        new ActionRowBuilder()
                            .addComponents(
                                new TextInputBuilder()
                                    .setCustomId('username')
                                    .setLabel('Username')
                                    .setStyle(TextInputStyle.Short)
                            )
                    )
                await interaction.showModal(modal);
                break;
            }
            case 'job': {
                let [monster, userId] = args.slice(2);
                if (userId == null) userId = user.id;
                selections[interaction.id] = {};

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                for (let alliances of monsters[monster].signups) {
                    for (let parties of alliances) {
                        for (let slot of parties) {
                            if (userId == slot?.user.id) {
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
                for (let alliance = 1; alliance < monsters[monster].alliances + 1; alliance++) {
                    for (let party = 1; party < monsters[monster].parties + 1; party++) {
                        for (let slot = 1; slot < monsters[monster].slots + 1; slot++) {
                            if (monsters[monster].signups[alliance - 1][party - 1][slot - 1] != null) continue;
                            let template = templateList.find(a => a.monster_name == monster.split('/')[0] && a.alliance_number == alliance && a.party_number == party && a.party_slot_number == slot)?.allowed_job_ids;
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
                                .setCustomId(`quickjoin-selectjob-${interaction.id}`)
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
                                .setCustomId(`quickjoin-confirm-${monster}-${interaction.id}-${userId}`)
                                .setLabel('✓')
                                .setStyle(ButtonStyle.Success)
                        )
                ]
                await interaction.reply({ ephemeral: true, components: buttons });
                break;
            }
            case 'confirm': {
                let [monster, id, userId] = args.slice(2);
                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                    .setTitle('Error')
                    .setColor('#ff0000')
                    .setDescription(`${monster} is not active`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                if (userId) user = userList.find(a => a.id == userId);

                for (let alliances of monsters[monster].signups) {
                    for (let parties of alliances) {
                        for (let slot of parties) {
                            if (slot?.user.id == userId) {
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
                for (let alliance = 1; emptySlot == null && alliance < monsters[monster].alliances + 1; alliance++) {
                    for (let party = 1; emptySlot == null && party < monsters[monster].parties + 1; party++) {
                        for (let slot = 1; emptySlot == null && slot < monsters[monster].slots + 1; slot++) {
                            if (monsters[monster].signups[alliance - 1][party - 1][slot - 1] != null) continue;
                            let template = templateList.find(a => a.monster_name == monster.split('/')[0] && a.alliance_number == alliance && a.party_number == party && a.party_slot_number == slot);
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
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                let { data, error } = await supabase.from(config.supabase.tables.signups).insert({
                    event_id: monsters[monster].event,
                    slot_template_id: templateId,
                    player_id: user.id,
                    assigned_job_id: job
                }).select('*').single();
                if (error) return await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Error updating database', error.message)] });
                
                monsters[monster].signups[alliance - 1][party - 1][slot - 1] = {
                    user,
                    job,
                    signupId: data.signup_id
                }
                delete selections[id];

                await monsters[monster].message.edit({ embeds: monsters[monster].createEmbeds() });
                await monsters[monster].updateLeaders();
                break;
            }
        }
    },
    async selectHandler({ interaction }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'selectjob': {
                let id = args[2];

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please click the sign up button again')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                interaction.deferUpdate();
                selections[id].job = interaction.values[0];
                break;
            }
        }
    },
    async modalHandler({ interaction, user, supabase, userList, jobList, templateList, monsters }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'user': {
                let monster = args[2];

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                let dbUser = userList.find(a => a.username == interaction.fields.getTextInputValue('username'));
                if (dbUser == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`Could not find user "${interaction.fields.getTextInputValue('username')}".`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                interaction.customId = `quickjoin-job-${monster}-${dbUser.id}`;
                this.buttonHandler({ interaction, user, supabase, userList, jobList, templateList, monsters });
                break;
            }
        }
    }
}