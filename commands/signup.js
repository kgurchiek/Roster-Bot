const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');

let selections = {};
module.exports = {
    data: new SlashCommandBuilder()
        .setName('signup'),
    async buttonHandler({ config, interaction, user, supabase, userList, jobList, templateList, monsters, logChannel }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'user': {
                let [monster, userId, todGrab] = args.slice(2);

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                interaction.customId = `signup-select-${monster}-${userId}-${todGrab}`;
                this.buttonHandler({ config, interaction, user, supabase, userList, jobList, templateList, monsters, logChannel });
                break;
            }
            case 'select': {
                let [monster, userId, todGrab] = args.slice(2);
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

                let buttons = [
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId(`signup-selectslot-alliance-${interaction.id}`)
                                .setPlaceholder('Select Alliance')
                                .addOptions(
                                    ...Array(monsters[monster].alliances).fill().map((a, i) =>
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel(`${i + 1}`)
                                            .setValue(`${i + 1}`)
                                    )
                                )
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId(`signup-selectslot-party-${interaction.id}`)
                                .setPlaceholder('Select Party')
                                .addOptions(
                                    ...Array(monsters[monster].parties).fill().map((a, i) => 
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
                                .setCustomId(`signup-selectslot-slot-${interaction.id}`)
                                .addOptions(
                                    ...Array(monsters[monster].slots).fill().map((a, i) => 
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel(`${i + 1}`)
                                            .setValue(`${i + 1}`)
                                    )
                                )
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`signup-job-${monster}-${interaction.id}-${userId}-${todGrab}`)
                                .setLabel('✓')
                                .setStyle(ButtonStyle.Success)
                        )
                ]

                await interaction.reply({ ephemeral: true, components: buttons });
                break;
            }
            case 'job': {
                let [monster, id, userId, todGrab] = args.slice(2);

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please click the sign up button again')
                    return await interaction.update({ ephemeral: true, embeds: [embed] });
                }

                let { alliance, party, slot } = selections[id];
                if (alliance == null) return await interaction.update({ ephemeral: true, embeds: [new EmbedBuilder().setTitle('Error').setColor('#ff0000').setDescription('Select which alliance you wish to join')] });
                if (party == null) return await interaction.update({ ephemeral: true, embeds: [new EmbedBuilder().setTitle('Error').setColor('#ff0000').setDescription('Select which party you wish to join')] });
                if (slot == null) return await interaction.update({ ephemeral: true, embeds: [new EmbedBuilder().setTitle('Error').setColor('#ff0000').setDescription('Select which slot you wish to join')] });

                if (monsters[monster].signups[alliance - 1][party - 1][slot - 1] != null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`Slot already filled by ${monsters[monster].signups[alliance - 1][party - 1][slot - 1].user.username}`)
                    return await interaction.update({ ephemeral: true, embeds: [embed] });
                }

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.update({ ephemeral: true, embeds: [embed] });
                }

                for (let alliances of monsters[monster].signups) {
                    for (let parties of alliances) {
                        for (let slot of parties) {
                            if (userId == slot?.user.id) {
                                let embed = new EmbedBuilder()
                                    .setTitle('Error')
                                    .setColor('#ff0000')
                                    .setDescription('You already signed up for this raid')
                                return await interaction.update({ ephemeral: true, embeds: [embed] });
                            }
                        }
                    }
                }

                let template = templateList.find(a => a.monster_name == monsters[monster].data.monster_name && a.alliance_number == alliance && a.party_number == party && a.party_slot_number == slot);
                let templateId = template?.slot_template_id;
                template = template?.allowed_job_ids;
                if (template == null) return await interaction.update({ ephemeral: true, embeds: [errorEmbed(`Error fetching jobs`, `Could not find template for monster "${monster}", alliance ${alliance}, party ${party}, slot ${slot}`)] });
                template = template.map(a => {
                    let job = jobList.find(b => b.job_id == a);
                    if (job == null) {
                        console.log(`Error: can't find job id: ${a}`);
                        return null;
                    }
                    return job;
                }).filter(a => a != null);

                let dbUser = userList.find(a => a.id == userId) || user;
                let buttons = [
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setPlaceholder('Select Job')
                                .setCustomId(`signup-selectjob-${id}`)
                                .addOptions(
                                    ...template.map(a => 
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel(a.job_name)
                                            .setValue(`${a.job_id}`)
                                    )
                                )
                        ),
                    dbUser.username.includes('(') ? new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setPlaceholder('Are you using an alt? (optional)')
                                .setCustomId(`signup-selectalt-${id}`)
                                .addOptions(
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('No (Default)')
                                        .setValue('false'),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('Yes')
                                        .setValue('true')
                                )
                        ) : null,
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setPlaceholder('Tag only? (optional)')
                                .setCustomId(`signup-selecttag-${id}`)
                                .addOptions(
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('No (Default)')
                                        .setValue('false'),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('Yes')
                                        .setValue('true')
                                )
                        ),
                     new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`signup-confirm-${monster}-${id}-${templateId}-${userId}-${todGrab}`)
                                .setLabel('✓')
                                .setStyle(ButtonStyle.Success)
                        )
                ].filter(a => a != null);
                await interaction.update({ ephemeral: true, content: '', embeds: [], components: buttons });
                break;
            }
            case 'confirm': {
                let [monster, id, templateId, userId, todGrab] = args.slice(2);
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
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                if (job == null) return await interaction.reply({ ephemeral: true, embeds: [new EmbedBuilder().setTitle('Error').setColor('#ff0000').setDescription('Select the job you wish to sign up for')] });

                monsters[monster].signups[alliance - 1][party - 1][slot - 1] = {
                    user,
                    job,
                    todGrab,
                    alt: selections[id].alt,
                    tag_only: selections[id].tag_only,
                    window: monster == 'Tiamat' ? monsters[monster].windows : null
                }
                if (todGrab == 'undefined') todGrab = null;
                let { data, error } = await supabase.from(config.supabase.tables.signups).insert({
                    event_id: monsters[monster].event,
                    slot_template_id: templateId,
                    player_id: user.id,
                    assigned_job_id: job,
                    todgrab: todGrab,
                    alt: selections[id].alt,
                    tag_only: selections[id].tag_only
                }).select('*').single();
                if (error) {
                    monsters[monster].signups[alliance - 1][party - 1][slot - 1] = null;
                    return await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Error updating database', error.message)] });
                }
                monsters[monster].signups[alliance - 1][party - 1][slot - 1].signupId = data.signup_id;
                delete selections[id];

                await interaction.update({ content: '​', embeds: [], components: [] });
                let embed = new EmbedBuilder().setDescription(`${user.username} has joined the ${monster} raid in alliance ${alliance}, party ${party}, slot ${slot} as a ${jobList.find(a => a.job_id == job)?.job_name || `[error: job id ${job} not found]`}.`);
                await logChannel.send({ embeds: [embed] });
                await monsters[monster].updateMessage();
                await monsters[monster].updateLeaders();
                break;
            }
        }
    },
    async selectHandler({ config, interaction }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'selectslot': {
                let [type, id] = args.slice(2);

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please click the sign up button again')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                interaction.deferUpdate();
                selections[id][type] = parseInt(interaction.values[0]);
                break;
            }
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
            case 'selectalt': {
                let id = args[2];

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please click the sign up button again')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                interaction.deferUpdate();
                selections[id].alt = interaction.values[0] == 'true';
                break;
            }
            case 'selecttag': {
                let id = args[2];

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please click the sign up button again')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                interaction.deferUpdate();
                selections[id].tag_only = interaction.values[0] == 'true';
                break;
            }
        }
    }
}