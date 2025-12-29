const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputStyle, TextInputBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { errorEmbed, scoreMatch } = require('../commonFunctions.js');

async function findMonster(interaction, monsterList) {
    let input = interaction.fields.getTextInputValue('monster');
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
                    .setCustomId(`todgrab-monster`)
                    .setPlaceholder('Similar monster names')
                    .addOptions(
                        names.map(a => 
                            new StringSelectMenuOptionBuilder()
                                .setLabel(a)
                                .setValue(a)
                        )
                    )
            )
    ]
    return await interaction.editReply({ content: '', embeds: [embed], components });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('todgrab'),
    async buttonHandler({ config, interaction, user, supabase, monsters, logChannel, getUser }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'select': {
                let modal = new ModalBuilder()
                    .setTitle('Add User')
                    .setCustomId(`todgrab-select`)
                    .addComponents(
                        new TextInputBuilder()
                            .setCustomId('monster')
                            .setLabel('Monster')
                            .setStyle(TextInputStyle.Short)
                    )
                await interaction.showModal(modal);
                break;

            }
            case 'monster': {
                let [monster, userId, force] = args.slice(2);
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
                                .setDescription(`You are already signed up for the ${monster} raid`)
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
                                .setDescription(`You are already signed up as Tod Grab for the ${item} raid, would you like to leave?`)
                            let button = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId(`todgrab-remove-${item}-${dbUser.id}`)
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
                        .setDescription(`${monsters[monster].todGrabber.username} is already signed up as Tod Grab for the ${monster} raid`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                monsters[monster].todGrabber = dbUser;
                let { error } = await supabase.from(config.supabase.tables.events).update({ todgrab: dbUser.id }).eq('event_id', monsters[monster].event);
                if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed(`Error updating Tod Grab`, error.message)] });
                await monsters[monster].updateMessage();
                let embed = new EmbedBuilder()
                    .setTitle('Success')
                    .setColor('#00ff00')
                    .setDescription(`You are now Tod Grab for the ${monster} raid`)
                await interaction.reply({ ephemeral: true, embeds: [embed] });
                embed = new EmbedBuilder().setDescription(`${dbUser.username} is now Tod Grab of the ${monster} raid.`);
                await logChannel.send({ embeds: [embed] });
                break;
            }
            case 'remove': {
                let [monster, userId] = args.slice(2);

                if (monsters[monster] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`${monster} is not active`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                if (monsters[monster].todGrabber.id != userId) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`You are not a leader in this raid`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }
                await interaction.deferReply({ ephemeral: true });
                monsters[monster].todGrabber = null;
                let { error } = await supabase.from(config.supabase.tables.events).update({ todgrab: null }).eq('event_id', monsters[monster].event);
                if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error updating Tod Grab', error.message)] });
                await monsters[monster].updateMessage();
                let embed = new EmbedBuilder()
                    .setTitle('Success')
                    .setColor('#00ff00')
                    .setDescription(`You are no longer Tod Grab for the ${monster} raid`)
                await interaction.editReply({ ephemeral: true, embeds: [embed] });
                break;
            }
        }
    },
    async selectHandler({ config, interaction, user, supabase, monsters, logChannel, getUser }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'monster': {
                interaction.customId = `todgrab-monster-${interaction.values[0]}`;
                await this.buttonHandler({ config, interaction, user, supabase, monsters, logChannel, getUser });
                break;
            }
        }
    },
    async modalHandler({ config, interaction, user, supabase, monsters, logChannel, monsterList, getUser }) {
        let args = interaction.customId.split('-');

        switch (args[1]) {
            case 'select': {
                input = interaction.fields.getTextInputValue('monster');
        
                if (!user.staff) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This action can only be performed by staff`)
                    return await interaction.update({ ephemeral: true, embeds: [embed] });
                }

                let dbUser = monsterList.find(a => a.monster_name.toLowerCase() == input.toLowerCase());
                if (dbUser == null) {
                    await interaction.deferReply({ ephemeral: true });
                    return await findMonster(interaction, monsterList);
                }

                interaction.customId = `todgrab-monster-${input}`;
                this.buttonHandler({ config, interaction, user, supabase, monsters, logChannel, getUser });
                break;
            }
        }
    }
}