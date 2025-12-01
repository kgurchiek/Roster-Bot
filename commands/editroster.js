const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');
const config = require('../config.json');

let selections = {};
module.exports = {
    data: new SlashCommandBuilder()
        .setName('editroster'),
    async buttonHandler({ interaction, user, supabase, userList, templateList, monsters }) {
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
                                template = templateList.find(a => a.monster_name == monster && a.alliance_number == alliance + 1 && a.party_number == party + 1 && a.party_slot_number == slot + 1);
                                if (template == null) return await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Error fetching slot template', `Couldn't find template for ${monster} alliance ${alliance}, party ${party}, slot ${slot}`)] })
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
                if (monsters[monster].signups[alliance][party][slot] != null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`Slot already filled by ${monsters[monster].signups[alliance][party][slot].user.username}`)
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
                    .setDescription(`You signed up for alliance ${alliance}, party ${party}, slot ${slot}`)
                await interaction.editReply({ ephemeral: true, embeds: [embed] });
                await monsters[monster].message.edit({ embeds: monsters[monster].createEmbeds() });
                await monsters[monster].updateLeaders();
                break;
            }
        }
    },
    async selectHandler({ interaction, user, monsters }) {
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
                        let components = [
                            new ActionRowBuilder()
                                .addComponents(
                                new ButtonBuilder()
                                    .setCustomId(`quickjoin-user-${monster}`)
                                    .setLabel('≫ Quick Join')
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId(`signup-user-${monster}`)
                                    .setLabel('📝 Sign Up')
                                    .setStyle(ButtonStyle.Primary)
                                )
                        ]
                        await interaction.update({ components });
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
                    case 'remove': {
                        let modal = new ModalBuilder()
                            .setTitle('Remove User')
                            .setCustomId(`leave-user-${monster}`)
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
        }
    },
    async modalHandler({ interaction, user, userList, monsters }) {
        let args = interaction.customId.split('-');

        switch (args[1]) {
            case 'move': {
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

                let dbUser = userList.find(a => a.username == interaction.fields.getTextInputValue('username'));
                if (dbUser == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`Could not find user "${interaction.fields.getTextInputValue('username')}".`)
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
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
        }
    }
}