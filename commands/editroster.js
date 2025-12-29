const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { errorEmbed, scoreMatch } = require('../commonFunctions.js');

async function findUser(interaction, userList) {
    let args = interaction.customId.split('-');
    let [command, monster] = args.slice(1);
    
    let input = interaction.fields.getTextInputValue('username');
    let usernames = userList.map(a => a.username);
    usernames.sort((a, b) =>
        scoreMatch(a.toLowerCase(), input.toLowerCase()) -
        scoreMatch(b.toLowerCase(), input.toLowerCase())
    )
    
    usernames = usernames.slice(0, 25);
    let embed = new EmbedBuilder()
        .setTitle('Error')
        .setColor('#ff0000')
        .setDescription(`User "${input}" not found, try selecting a similar username below:`)
    let components = [
        new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`editroster-username-${command}-${monster}`)
                    .setPlaceholder('Similar usernames')
                    .addOptions(
                        usernames.map(a => 
                            new StringSelectMenuOptionBuilder()
                                .setLabel(a)
                                .setValue(a.toLowerCase())
                        )
                    )
            )
    ]
    return await interaction.editReply({ content: '', embeds: [embed], components });
}

let selections = {};
module.exports = {
    data: new SlashCommandBuilder()
        .setName('editroster'),
    async buttonHandler({ config, interaction, user, supabase, userList, templateList, monsters, logChannel }) {
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

                if (!user.staff) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This action can only be performed by staff`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                let components = [
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId(`editroster-action-${monster}`)
                                .setPlaceholder('Select an action...')
                                .addOptions(
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('Add user')
                                        .setValue('add'),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('Move user')
                                        .setValue('move'),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('Set leader')
                                        .setValue('leader'),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('Set Tod Grab')
                                        .setValue('todgrab'),
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel('Remove user')
                                        .setValue('remove')
                                )
                        )
                ]
                await interaction.reply({ ephemeral: true, components });
                break;
            }
            case 'move': {
                let [monster, id, userId] = args.slice(2);
                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please click the edit roster button again')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                if (userId) user = userList.find(a => a.id == userId);

                let signupId, template, rosterSlot;
                for (let alliance = 0; alliance < monsters[monster].signups.length; alliance++) {
                    for (let party = 0; party < monsters[monster].signups[alliance].length; party++) {
                        for (let slot = 0; slot < monsters[monster].signups[alliance][party].length; slot++) {
                            if (userId == monsters[monster].signups[alliance][party][slot]?.user.id) {
                                signupId = monsters[monster].signups[alliance][party][slot].signupId;
                                template = templateList.find(a => a.monster_name == monsters[monster].data.monster_name && a.alliance_number == alliance + 1 && a.party_number == party + 1 && a.party_slot_number == slot + 1);
                                if (template == null) return await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Error fetching slot template', `Couldn't find template for ${monsters[monster].data.monster_name} alliance ${alliance + 1}, party ${party + 1}, slot ${slot + 1}`)] })
                                rosterSlot = { alliance, party, slot };
                            }
                        }
                    }
                }

                if (signupId == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${user.username} is not signed up for this raid`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                let { alliance, party, slot } = selections[id];
                if (monsters[monster].signups[alliance - 1][party - 1][slot - 1] != null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`Slot already filled by ${monsters[monster].signups[alliance - 1][party - 1][slot - 1].user.username}`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                await interaction.deferReply({ ephemeral: true });
                let { error } = await supabase.from(config.supabase.tables.signups).update({ slot_template_id: template.slot_template_id }).eq('signup_id', signupId);
                if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error updating signup', error.message)] });
                
                monsters[monster].signups[alliance - 1][party - 1][slot - 1] = monsters[monster].signups[rosterSlot.alliance][rosterSlot.party][rosterSlot.slot];
                monsters[monster].signups[alliance - 1][party - 1][slot - 1].signupId = signupId;
                monsters[monster].signups[rosterSlot.alliance][rosterSlot.party][rosterSlot.slot] = null;
                delete selections[id];

                let embed = new EmbedBuilder()
                    .setTitle('Success')
                    .setColor('#00ff00')
                    .setDescription(`Moved ${user.username} to alliance ${alliance}, party ${party}, slot ${slot}`)
                await interaction.editReply({ ephemeral: true, embeds: [embed] });
                embed = new EmbedBuilder().setDescription(`Moved ${user.username} in the ${monster} raid to alliance ${alliance}, party ${party}, slot ${slot}`);
                await logChannel.send({ embeds: [embed] });
                await monsters[monster].message.edit({ embeds: monsters[monster].createEmbeds() });
                await monsters[monster].updateLeaders();
                break;
            }
        }
    },
    async selectHandler({ config, interaction, client, user, supabase, userList, monsters, logChannel }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'action': {
                let monster = args[2];

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.update({ ephemeral: true, embeds: [embed] });
                }

                if (!user.staff) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This action can only be performed by staff`)
                    return await interaction.update({ ephemeral: true, embeds: [embed] });
                }

                switch(interaction.values[0]) {
                    case 'add': {
                        let modal = new ModalBuilder()
                            .setTitle('Add User')
                            .setCustomId(`editroster-add-${monster}`)
                            .addComponents(
                                new TextInputBuilder()
                                    .setCustomId('username')
                                    .setLabel('Username')
                                    .setStyle(TextInputStyle.Short)
                            )
                        await interaction.showModal(modal);
                        break;
                    }
                    case 'move': {
                        let modal = new ModalBuilder()
                            .setTitle('Move User')
                            .setCustomId(`editroster-move-${monster}`)
                            .addComponents(
                                new TextInputBuilder()
                                    .setCustomId('username')
                                    .setLabel('Username')
                                    .setStyle(TextInputStyle.Short)
                            )
                        await interaction.showModal(modal);
                        break;
                    }
                    case 'leader': {
                        let modal = new ModalBuilder()
                            .setTitle('Edit Leader')
                            .setCustomId(`editroster-leader-${monster}`)
                            .addComponents(
                                new TextInputBuilder()
                                    .setCustomId('username')
                                    .setLabel('Username')
                                    .setStyle(TextInputStyle.Short)
                            )
                        await interaction.showModal(modal);
                        break;
                    }
                    case 'todgrab': {
                        let modal = new ModalBuilder()
                            .setTitle('Edit Tod Grab')
                            .setCustomId(`editroster-todgrab-${monster}`)
                            .addComponents(
                                new TextInputBuilder()
                                    .setCustomId('username')
                                    .setLabel('Username')
                                    .setStyle(TextInputStyle.Short)
                            )
                        await interaction.showModal(modal);
                        break;
                    }
                    case 'remove': {
                        let modal = new ModalBuilder()
                            .setTitle('Remove User')
                            .setCustomId(`editroster-leave-${monster}`)
                            .addComponents(
                                new TextInputBuilder()
                                    .setCustomId('username')
                                    .setLabel('Username')
                                    .setStyle(TextInputStyle.Short)
                            )
                        await interaction.showModal(modal);
                        break;
                    }
                }
                break;
            }
            case 'selectslot': {
                let [type, id] = args.slice(2);

                if (selections[id] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This message has expired, please click the edit roster button again')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                interaction.deferUpdate();
                selections[id][type] = parseInt(interaction.values[0]);
                break;
            }
            case 'username': {
                let [command, monster] = args.slice(2);
                
                interaction.customId = `editroster-${command}-${monster}-${interaction.values[0]}`;
                await this.modalHandler({ config, interaction, client, user, supabase, userList, monsters, logChannel });
                break;
            }
        }
    },
    async modalHandler({ config, interaction, client, user, supabase, userList, monsters, logChannel, jobList, getUser }) {
        let args = interaction.customId.split('-');

        switch (args[1]) {
            case 'add': {
                let [monster, username] = args.slice(2);
                if (!username) username = interaction.fields.getTextInputValue('username').toLowerCase();

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.update({ ephemeral: true, embeds: [embed] });
                }
        
                if (!user.staff) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This action can only be performed by staff`)
                    return await interaction.update({ ephemeral: true, embeds: [embed] });
                }

                let dbUser = userList.find(a => {
                    if (a.username.toLowerCase() == username) return true;
                    let names = [a.username.slice(0, a.username.indexOf('('))];
                    let altNames = a.username.slice(a.username.indexOf('(')).trim();
                    if (altNames.endsWith(')')) altNames = altNames.slice(0, -1);
                    names = names.concat(altNames.split(',')).map(a => a.trim().toLowerCase());
                    if (names.includes(username)) return true;
                });
                if (dbUser == null) {
                    await interaction.deferUpdate();
                    return await findUser(interaction, userList);
                }

                let components = [
                    new ActionRowBuilder()
                        .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`quickjoin-user-${monster}-${dbUser.id}`)
                            .setLabel('≫ Quick Join')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId(`signup-user-${monster}-${dbUser.id}`)
                            .setLabel('📝 Sign Up')
                            .setStyle(ButtonStyle.Primary)
                        )
                ];
                await interaction.update({ content: '', embeds: [], components });
                break;
            }
            case 'move': {
                let [monster, username] = args.slice(2);
                if (!username) username = interaction.fields.getTextInputValue('username').toLowerCase();

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.update({ ephemeral: true, embeds: [embed] });
                }

                if (!user.staff) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This action can only be performed by staff`)
                    return await interaction.update({ ephemeral: true, embeds: [embed] });
                }

                let dbUser = userList.find(a => {
                    if (a.username.toLowerCase() == username) return true;
                    let names = [a.username.slice(0, a.username.indexOf('('))];
                    let altNames = a.username.slice(a.username.indexOf('(')).trim();
                    if (altNames.endsWith(')')) altNames = altNames.slice(0, -1);
                    names = names.concat(altNames.split(',')).map(a => a.trim().toLowerCase());
                    if (names.includes(username)) return true;
                });
                if (dbUser == null) {
                    await interaction.deferUpdate();
                    return await findUser(interaction, userList);
                }

                selections[interaction.id] = {};
                let buttons = [
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId(`editroster-selectslot-alliance-${interaction.id}`)
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
                                .setCustomId(`editroster-selectslot-party-${interaction.id}`)
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
                                .setCustomId(`editroster-selectslot-slot-${interaction.id}`)
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
                                .setCustomId(`editroster-move-${monster}-${interaction.id}-${dbUser.id}`)
                                .setLabel('✓')
                                .setStyle(ButtonStyle.Success)
                        )
                ]
                await interaction.update({ embeds: [], components: buttons });
                break;
            }
            case 'leader': {
                let [monster, username] = args.slice(2);
                if (!username) username = interaction.fields.getTextInputValue('username').toLowerCase();

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.update({ ephemeral: true, embeds: [embed] });
                }
        
                if (!user.staff) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This action can only be performed by staff`)
                    return await interaction.update({ ephemeral: true, embeds: [embed] });
                }

                let dbUser = userList.find(a => {
                    if (a.username.toLowerCase() == username) return true;
                    let names = [a.username.slice(0, a.username.indexOf('('))];
                    let altNames = a.username.slice(a.username.indexOf('(')).trim();
                    if (altNames.endsWith(')')) altNames = altNames.slice(0, -1);
                    names = names.concat(altNames.split(',')).map(a => a.trim().toLowerCase());
                    if (names.includes(username)) return true;
                });
                if (dbUser == null) {
                    await interaction.deferUpdate();
                    return await findUser(interaction, userList);
                }

                let command = client.commands.get('leader');
                if (command == null) return await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Error fetching command', 'Could not fetch leader command')] });
                interaction.customId = `leader-monster-${monster}-${dbUser.id}-true`;
                command.buttonHandler({ config, interaction, user, supabase, monsters, logChannel, jobList, getUser });
                break;
            }
            case 'todgrab': {
                let [monster, username] = args.slice(2);
                if (!username) username = interaction.fields.getTextInputValue('username').toLowerCase();

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.update({ ephemeral: true, embeds: [embed] });
                }
        
                if (!user.staff) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This action can only be performed by staff`)
                    return await interaction.update({ ephemeral: true, embeds: [embed] });
                }

                let dbUser = userList.find(a => {
                    if (a.username.toLowerCase() == username) return true;
                    let names = [a.username.slice(0, a.username.indexOf('('))];
                    let altNames = a.username.slice(a.username.indexOf('(')).trim();
                    if (altNames.endsWith(')')) altNames = altNames.slice(0, -1);
                    names = names.concat(altNames.split(',')).map(a => a.trim().toLowerCase());
                    if (names.includes(username)) return true;
                });
                if (dbUser == null) {
                    await interaction.deferUpdate();
                    return await findUser(interaction, userList);
                }

                let command = client.commands.get('todgrab');
                if (command == null) return await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Error fetching command', 'Could not fetch todgrab command')] });
                interaction.customId = `todgrab-monster-${monster}-${dbUser.id}-true`;
                command.buttonHandler({ config, interaction, user, supabase, monsters, logChannel, getUser });
                break;
            }
            case 'leave': {
                let [monster, username] = args.slice(2);
                if (!username) username = interaction.fields.getTextInputValue('username').toLowerCase();

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.update({ ephemeral: true, embeds: [embed] });
                }
        
                if (!user.staff) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This action can only be performed by staff`)
                    return await interaction.update({ ephemeral: true, embeds: [embed] });
                }

                let dbUser = userList.find(a => {
                    if (a.username.toLowerCase() == username) return true;
                    let names = [a.username.slice(0, a.username.indexOf('('))];
                    let altNames = a.username.slice(a.username.indexOf('(')).trim();
                    if (altNames.endsWith(')')) altNames = altNames.slice(0, -1);
                    names = names.concat(altNames.split(',')).map(a => a.trim().toLowerCase());
                    if (names.includes(username)) return true;
                });
                if (dbUser == null) {
                    await interaction.deferUpdate();
                    return await findUser(interaction, userList);
                }

                let command = client.commands.get('leave');
                if (command == null) return await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Error fetching command', 'Could not fetch leave command')] });
                interaction.customId = `leave-monster-${monster}-${dbUser.id}`;
                command.buttonHandler({ config, interaction, user, supabase, userList, monsters, logChannel });
                break;
            }
        }
    }
}