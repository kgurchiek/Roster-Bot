const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputStyle, TextInputBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { errorEmbed, scoreMatch } = require('../commonFunctions.js');

async function findMonster(config, interaction, input, monsterList, args) {
    let names = monsterList.map(a => a.monster_name);
    names.sort((a, b) =>
        scoreMatch(a.toLowerCase(), input.toLowerCase()) -
        scoreMatch(b.toLowerCase(), input.toLowerCase())
    )
    
    names = names.slice(0, 25);
    let embed = new EmbedBuilder()
        .setTitle('Error')
        .setColor('#ff0000')
        .setDescription(`Monster "${input}" not found, try selecting a similar username below:`)
    let components = [
        new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`todgrab-monster-${args.join('-')}`)
                    .setPlaceholder('Similar monster names')
                    .addOptions(
                        ...names.map((a, i) => {
                            let group = config.roster.monsterGroups.find(b => b.includes(a)) || [a];
                            if (names.slice(0, i).find(b => group.includes(b))) return null;
                            return new StringSelectMenuOptionBuilder()
                                .setLabel(group.join('/'))
                                .setValue(group.join('/'))
                        }).filter(a => a != null)
                    )
            )
    ]
    return await interaction.editReply({ content: '', embeds: [embed], components });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('todgrab'),
    async buttonHandler({ config, interaction, user, supabase, monsters, logChannel, monsterList, getUser }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'select': {
                let [monster, userId, force, input] = args.slice(2);

                if (input) {
                    interaction.customId = `todgrab-select-${monster}-${userId}-${force}-${input}`;
                    return await this.modalHandler({ config, interaction, user, supabase, monsters, logChannel, monsterList, getUser });
                } else {
                    let modal = new ModalBuilder()
                        .setTitle('Add User')
                        .setCustomId(`todgrab-select-${monster}`)
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId('monster')
                                .setLabel('Monster')
                                .setStyle(TextInputStyle.Short)
                        )
                    await interaction.showModal(modal);
                }
                break;

            }
            case 'monster': {
                let [monster, originalMonster, userId, force] = args.slice(2);
                console.log({ monster, originalMonster, userId, force })
                let dbUser;
                if (!userId) dbUser = user;
                else {
                    dbUser = await getUser(userId);
                    if (dbUser.error) return await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Error fetching user', `Couldn't find user with id "${userId}"`)] });
                }
                force = force == 'true';

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
                            if (monsters[monster].signups[i][j][k] == null || monsters[monster].signups[i][j][k].user.id != dbUser.id) continue;
                            
                            let embed = new EmbedBuilder()
                                .setTitle('Error')
                                .setColor('#ff0000')
                                .setDescription(`You are already signed up for ${monster}`)
                            return await interaction.reply({ ephemeral: true, embeds: [embed] });
                        }
                    }
                }

                for (let item in monsters) {
                    if (monsters[item].todGrabber?.id == dbUser.id) {
                        if (monsters[item].todGrabber.id == dbUser.id) {
                            let embed = new EmbedBuilder()
                                .setTitle('Warning')
                                .setColor('#ffff00')
                                .setDescription(`You are already signed up as Tod Grab for ${item}, would you like to leave?`)
                            let button = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId(`todgrab-remove-${item}-${dbUser.id}-${originalMonster}`)
                                        .setLabel('✓')
                                        .setStyle(ButtonStyle.Success)
                                )
                            return await interaction.reply({ ephemeral: true, embeds: [embed], components: [button] });
                        }
                    }
                }
                if (monsters[monster].todGrabber != null && !force) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monsters[monster].todGrabber.username} is already signed up as Tod Grab for ${monster}`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                monsters[monster].todGrabber = dbUser;
                let { error } = await supabase.from(config.supabase.tables.events).update({ todgrab: dbUser.id }).eq('event_id', monsters[monster].event);
                if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed(`Error updating Tod Grab`, error.message)] });
                
                if (monsters[originalMonster] != null) {
                    ({ data, error } = await supabase.from(config.supabase.tables.signups).insert({ event_id: monsters[originalMonster].event, player_id: dbUser.id, active: true, todgrab: monster }).select('*, player_id (id, username)'));
                    if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed(`Error inserting Tod Grab signup`, error.message)] });
                    monsters[originalMonster].todGrabs.push(data[0]);
                    await monsters[originalMonster].updateMessage();
                }

                await monsters[monster].updateMessage();
                let embed = new EmbedBuilder()
                    .setTitle('Success')
                    .setColor('#00ff00')
                    .setDescription(`You are now Tod Grab for ${monster}`)
                await interaction.reply({ ephemeral: true, embeds: [embed] });
                embed = new EmbedBuilder().setDescription(`${dbUser.username} is now Tod Grab of ${monster}.`);
                await logChannel.send({ embeds: [embed] });
                break;
            }
            case 'remove': {
                let [monster, userId, originalMonster] = args.slice(2);

                if (monsters[monster].todGrabber.id != userId) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`You are not Tod Grab for ${monster}`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                await interaction.deferReply({ ephemeral: true });
                monsters[monster].todGrabber = null;
                let { error } = await supabase.from(config.supabase.tables.events).update({ todgrab: null }).eq('event_id', monsters[monster].event);
                if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error updating Tod Grab', error.message)] });

                if (monsters[originalMonster] != null) {
                    ({ error } = await supabase.from(config.supabase.tables.signups).delete().eq('event_id', monsters[originalMonster].event).eq('player_id', userId).neq('todgrab', null).select('*, player_id (id, username)'));
                    if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed(`Error delete Tod Grab signup`, error.message)] });
                    monsters[originalMonster].todGrabs = monsters[originalMonster].todGrabs.filter(a => a.player_id.id != userId);
                    await monsters[originalMonster].updateMessage();
                }
                
                await monsters[monster].updateMessage();
                let embed = new EmbedBuilder()
                    .setTitle('Success')
                    .setColor('#00ff00')
                    .setDescription(`You are no longer Tod Grab for ${monster}`)
                await interaction.editReply({ ephemeral: true, embeds: [embed] });
                break;
            }
        }
    },
    async selectHandler({ config, interaction, user, supabase, monsters, logChannel, getUser }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'monster': {
                let [originalMonster, userId, force] = args.slice(2);

                interaction.customId = `todgrab-monster-${interaction.values[0]}-${originalMonster}-${userId}-${force}`;
                await this.buttonHandler({ config, interaction, user, supabase, monsters, logChannel, getUser });
                break;
            }
        }
    },
    async modalHandler({ config, interaction, user, supabase, monsters, logChannel, monsterList, getUser }) {
        let args = interaction.customId.split('-');

        switch (args[1]) {
            case 'select': {
                let [originalMonster, userId, force, input] = args.slice(2);
                if (!input) input = interaction.fields.getTextInputValue('monster');

                let monster = monsterList.find(a => a.monster_name.toLowerCase() == input.toLowerCase());
                if (monster == null) {
                    await interaction.deferReply({ ephemeral: true });
                    return await findMonster(config, interaction, input, monsterList, [originalMonster, userId, force]);
                }

                let group = config.roster.monsterGroups.find(a => a.includes(input)) || [input];
                interaction.customId = `todgrab-monster-${group.join('/')}-${originalMonster}-${userId}-${force}`;
                this.buttonHandler({ config, interaction, user, supabase, monsters, logChannel, getUser });
                break;
            }
        }
    }
}