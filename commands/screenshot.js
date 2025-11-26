const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, FileUploadBuilder, LabelBuilder, ChannelType } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('screenshot'),
    async buttonHandler({ interaction, user, supabase, archive }) {
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

                let private = signupId != null;
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
                                .setCustomId(`screenshot-confirm-${event}-${signupId}`)
                                .setLabel('✓')
                                .setStyle(ButtonStyle.Success)
                        )
                    return await interaction.reply({ ephemeral: true, embeds: [embed], components: [buttons] });
                }
                interaction.customId = `screenshot-confirm-${event}-${signupId}`;
                this.buttonHandler({ interaction, user, supabase, archive });
                break;
            }
            case 'confirm': {
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

                return await interaction.showModal(modal);
            }
        }
    },
    async modalHandler({ interaction, supabase, archive, ocrCategory }) {
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
            return console.log('Error fetching attachment:', err);
        }

        let channels = [...(await ocrCategory.guild.channels.fetch(null, { force: true })).values()].filter(a => a.parentId == ocrCategory.id);
        let group = config.discord.threadGroups.find(a => a.includes(archive[event].name));
        let name = (group == null ? archive[event].name : group.join('—')).replaceAll(' ', '-').toLowerCase();
        let channel = channels.find(a => a.name == name);
        if (channel == null) {
            try {
                channel = await ocrCategory.children.create({
                    name,
                    type: ChannelType.GuildText
                });
            } catch (err) {
                return console.log('Error creating channel:', err);
            }
        }
        let message;
        try {
            message = await channel.send({ files: [{ attachment: Buffer.from(file), name: `${interaction.id}.${attachment.contentType.split('/')[1]}` }] });
        } catch (err) {
            return console.log('Error sending screenshot message:', err);
        }

        let { error } = await supabase.storage.from(config.supabase.buckets.screenshots).upload(message.id, file, { contentType: attachment.contentType });
        if (error) return console.log('Error uploading screenshot:', error.message);

        ({ error } = await supabase.from(config.supabase.tables.signups).update({ screenshot: message.id }).eq('signup_id', signupId));
        if (error) return console.log('Error updating screenshot:', error);
        archive[event].data.signups.find(a => a.signup_id == signupId).screenshot = message.id;

        let embed = new EmbedBuilder()
            .setTitle('Success')
            .setColor('#00ff00')
            .setDescription('Your screenshot has been uploaded')
            .setFooter({ text: `screenshot id: ${message.id}` })
        await interaction.editReply({ ephemeral: true, embeds: [embed] });
    }
}