const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, FileUploadBuilder, LabelBuilder, ChannelType } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');

async function uploadFile(interaction, user, supabase, ocrCategory, logChannel, event, signupId, attachment, file) {
    let channelName = (event.group ? event.group.map(a => a).join('—') : event.name).replaceAll(' ', '-').toLowerCase()
    let channels = [...(await ocrCategory.guild.channels.fetch(null, { force: true })).values()].filter(a => a.parentId == ocrCategory.id);
    let channel = channels.find(a => a.name == channelName);
    if (channel == null) {
        try {
            channel = await ocrCategory.children.create({
                name: channelName,
                type: ChannelType.GuildText
            });
        } catch (err) {
            return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error creating screenshot channel:', err)]});
        }
    }
    let message;
    try {
        message = await channel.send({ files: [{ attachment: Buffer.from(file), name: `${interaction.id}.${attachment.contentType.split('/')[1]}` }] });
    } catch (err) {
        return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error sending screenshot message:', err)]});
    }

    let { error } = await supabase.storage.from(config.supabase.buckets.screenshots).upload(message.id, file, { contentType: attachment.contentType });
    if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error uploading screenshot:', error.message)]});

    ({ error } = await supabase.from(config.supabase.tables.signups).update({ screenshot: message.id }).eq('event_id', event.event).eq('player_id', user.id));
    if (error) return console.log('Error updating screenshot:', error);
    event.data.signups.find(a => a.signup_id == signupId).screenshot = message.id;

    let embed = new EmbedBuilder()
        .setTitle('Success')
        .setColor('#00ff00')
        .setDescription('Your screenshot has been uploaded')
        .setFooter({ text: `screenshot id: ${message.id}` })
    await interaction.editReply({ ephemeral: true, embeds: [embed] });
    embed = new EmbedBuilder().setDescription(`${user.username} has uploaded a screenshot for the ${event.name} raid.`);
    await logChannel.send({ embeds: [embed] });
    await event.updatePanel();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('screenshot'),
    async buttonHandler({ config, interaction, user, supabase, archive, ocrCategory, logChannel, messageCallbacks }) {
        let args = interaction.customId.split('-');
        switch (args[1]) {
            case 'monster': {
                let [event, signupId] = args.slice(2);

                if (archive[event] == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription(`This raid has been closed`)
                        .setFooter({ text: `raid id: ${event}` })
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                if (Date.now() - archive[event].closeDate.getTime() > 6 * 60 * 60 * 1000) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('This raid is no longer accepting attendance screenshots')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                if (signupId == null) signupId = archive[event].data.signups?.find(a => a.player_id.id == user.id)?.signup_id;
                if (signupId == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('You did not participate in this raid')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                let { data, error } = await supabase.from(config.supabase.tables.signups).select('*').eq('signup_id', signupId).single();
                if (error) return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error fetching signup', error.message)] });

                if (data.screenshot != null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Warning')
                        .setColor('#ffff00')
                        .setDescription('You already submitted a screenshot, would you like to submit a different one instead?')
                    let buttons = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`screenshot-confirm-${event}-${signupId}-true`)
                                .setLabel('✓')
                                .setStyle(ButtonStyle.Success)
                        )
                    return await interaction.reply({ ephemeral: true, embeds: [embed], components: [buttons] });
                }
                interaction.customId = `screenshot-confirm-${event}-${signupId}`;
                this.buttonHandler({ config, interaction, user, supabase, archive });
                break;
            }
            case 'confirm': {
                let [event, signupId, manual] = args.slice(2);

                if (signupId == null) signupId = archive[event].data.signups?.find(a => a.player_id.id == user.id)?.signup_id;
                if (signupId == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('You did not participate in this raid')
                    if (manual == 'true') return await interaction.update({ ephemeral: true, embeds: [embed] });
                    else return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                let components = [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`screenshot-modal-${event}-${signupId}`)
                                .setStyle(ButtonStyle.Primary)
                                .setLabel('📁 Open File'),
                            new ButtonBuilder()
                                .setCustomId(`screenshot-paste-${event}-${signupId}`)
                                .setStyle(ButtonStyle.Primary)
                                .setLabel('📋 Paste Screenshot')
                        )
                ]

                if (manual == 'true') await interaction.update({ ephemeral: true, embeds: [], components });
                else await interaction.reply({ ephemeral: true, embeds: [], components });
                break;
            }
            case 'modal': {
                let [event, signupId] = args.slice(2);

                if (signupId == null) signupId = archive[event].data.signups?.find(a => a.player_id.id == user.id)?.signup_id;
                if (signupId == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('You did not participate in this raid')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                let modal = new ModalBuilder()
                    .setCustomId(`screenshot-${event}-${signupId}`)
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
                let [event, signupId] = args.slice(2);

                if (signupId == null) signupId = archive[event].data.signups?.find(a => a.player_id.id == user.id)?.signup_id;
                if (signupId == null) {
                    let embed = new EmbedBuilder()
                        .setTitle('Error')
                        .setColor('#ff0000')
                        .setDescription('You did not participate in this raid')
                    return await interaction.reply({ ephemeral: true, embeds: [embed] });
                }

                await interaction.update({ embeds: [new EmbedBuilder().setDescription('Send your screenshot below:')], components: [] });
                messageCallbacks.push({
                    id: interaction.id,
                    channel: interaction.channelId,
                    callback: async message => {
                        if (message.author.id != user.id || message.attachments.size == 0) return;
                        let attachment = message.attachments.entries().next().value[1];
                        let file;
                        try {
                            file = await (await fetch(attachment.url)).arrayBuffer();
                        } catch (err) {
                            return await interaction.reply({ ephemeral: true, embeds: [errorEmbed('Error fetching attachment', err)]});
                        }
                        await message.delete();
                        
                        uploadFile(interaction, user, supabase, ocrCategory, logChannel, archive[event], signupId, attachment, file);
                        messageCallbacks[messageCallbacks.findIndex(a => a.id == interaction.id)] = null;
                    }
                })
            }
        }
    },
    async modalHandler({ config, interaction, user, supabase, archive, ocrCategory, logChannel }) {
        let args = interaction.customId.split('-');
        let [event, signupId] = args.slice(1);

        if (archive[event] == null) {
            let embed = new EmbedBuilder()
                .setTitle('Error')
                .setColor('#ff0000')
                .setDescription('This raid has been closed')
                .setFooter({ text: `raid id: ${event}` })
            return await interaction.reply({ ephemeral: true, embeds: [embed] });
        }

        await interaction.deferReply({ ephemeral: true });
        let attachment = interaction.fields.fields.values().next().value.attachments.values().next().value;
        let file;
        try {
            file = await (await fetch(attachment.url)).arrayBuffer();
        } catch (err) {
            return await interaction.editReply({ ephemeral: true, embeds: [errorEmbed('Error fetching attachment', err)]});
        }

        uploadFile(interaction, user, supabase, ocrCategory, logChannel, archive[event], signupId, attachment, file);
    }
}