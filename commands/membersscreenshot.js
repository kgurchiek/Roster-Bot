const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, FileUploadBuilder, LabelBuilder, ChannelType, AttachmentBuilder } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('membersscreenshot'),
    async buttonHandler({ config, interaction, user, archive, memberScreenshotsChannel, messageCallbacks }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'modal': {
                let [event, window, alliance] = args.slice(2);

                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has been closed`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                let modal = new ModalBuilder()
                    .setCustomId(`membersscreenshot-${event}-${window}`)
                    .setTitle(`${archive[event].name} Screenshot`)
                    .addLabelComponents(
                        new LabelBuilder()
                            .setLabel('Upload screenshot...')
                            .setFileUploadComponent(
                                new FileUploadBuilder()
                                    .setCustomId(`screenshot`)
                                    .setMinValues(1)
                                    .setMaxValues(1)
                            )
                    )

                await interaction.showModal(modal);
                break;
            }
            case 'paste': {
                let [event, window, alliance] = args.slice(2);
                window = parseInt(window);

                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has been closed`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                await interaction.update({ embeds: [new EmbedBuilder().setDescription('Send your screenshot below:')], components: [] });
                messageCallbacks.push({
                    id: interaction.id,
                    channel: interaction.channelId,
                    callback: async message => {
                        if (message.author.id != user.id || message.attachments.size == 0) return;
                        messageCallbacks[messageCallbacks.findIndex(a => a.id == interaction.id)] = null;
                        let { contentType, url} = message.attachments.entries().next().value[1];
                        let file;
                        try {
                            file = Buffer.from(await (await fetch(url)).arrayBuffer());
                        } catch (err) {
                            return await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Error fetching attachment', err)]});
                        }
                        await message.delete();
                        
                        let name = `${interaction.id}.${contentType.split('/')[1]}`;
                        let attachment = new AttachmentBuilder(file, { name });
                        let embed = new EmbedBuilder()
                            .setDescription(`${user.username} uploaded a member list screenshot for window ${window + 1}, alliance ${alliance} of the ${archive[event].name} raid:`)
                            .setImage(`attachment://${name}`)
                        await memberScreenshotsChannel.send({ embeds: [embed], files: [attachment] });
                        archive[event].verifiedClears.push(window);
                        await archive[event].updateMessage();
                        embed = new EmbedBuilder()
                            .setTitle('Success')
                            .setDescription(`Uploaded member list screenshot for window ${window + 1}, alliance ${alliance}`)
                            .setImage(`attachment://${name}`)
                        await interaction.editReply({ ephemeral: true, embeds: [embed], files: [attachment], components: [] });
                    }
                })
            }
        }
    },
    async selectHandler({ config, interaction, archive }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'window': {
                let event = args[2];
        
                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has been closed`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                let components = [
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId(`membersscreenshot-alliance-${event}-${interaction.values[0]}`)
                                .setPlaceholder('Select alliance...')
                                .addOptions(
                                    Array(4).fill().map((a, i) => 
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel(`Alliance ${i + 1}`)
                                            .setValue(`${i + 1}`)
                                    )
                                )
                        )
                ]
                await interaction.reply({ ephemeral: true, components });
                break;
            }
            case 'alliance': {
                let [event, window] = args.slice(2);
        
                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has been closed`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                let components = [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`membersscreenshot-modal-${event}-${window}-${interaction.values[0]}`)
                                .setStyle(ButtonStyle.Primary)
                                .setLabel('📁 Open File'),
                            new ButtonBuilder()
                                .setCustomId(`membersscreenshot-paste-${event}-${window}-${interaction.values[0]}`)
                                .setStyle(ButtonStyle.Primary)
                                .setLabel('📋 Paste Screenshot')
                        )
                ]
                await interaction.reply({ ephemeral: true, embeds: [], components });
                break;
            }
        }


    },
    async modalHandler({ config, interaction, user, archive, memberScreenshotsChannel }) {
        let args = interaction.customId.split('-');
        let [event, window] = args.slice(1);
        window = parseInt(window);

        if (archive[event] == null) {
            let embed = new EmbedBuilder()
                .setTitle('Error')
                .setColor('#ff0000')
                .setDescription('This raid has been closed')
                .setFooter({ text: `raid id: ${event}` })
            return await interaction.reply({ ephemeral: true, embeds: [embed] });
        }

        await interaction.deferUpdate();
        let { contentType, url} = interaction.fields.fields.values().next().value.attachments.values().next().value;
        let file;
        try {
            file = Buffer.from(await (await fetch(url)).arrayBuffer());
        } catch (err) {
            return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error fetching attachment', err)], components: [] });
        }

        let name = `${interaction.id}.${contentType.split('/')[1]}`;
        let attachment = new AttachmentBuilder(file, { name });
        let embed = new EmbedBuilder()
            .setDescription(`${user.username} uploaded a member list screenshot for window ${window + 1}, alliance ${alliance} of the ${archive[event].name} raid:`)
            .setImage(`attachment://${name}`)
        await memberScreenshotsChannel.send({ embeds: [embed], files: [attachment] });
        archive[event].verifiedClears.push(window);
        await archive[event].updateMessage();
        embed = new EmbedBuilder()
            .setTitle('Success')
            .setDescription(`Uploaded member list screenshot for window ${window + 1}, alliance ${alliance}`)
            .setImage(`attachment://${name}`)
        await interaction.editReply({ ephemeral: true, embeds: [embed], files: [attachment], components: [] });
    }
}