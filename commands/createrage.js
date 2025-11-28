const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createrage')
        .setDescription('Opens a roster for a user')
        .addStringOption(option =>
            option.setName('monster')
                .setDescription('the monster to open a roster for')
                .setAutocomplete(true)
                .setRequired(true)
        ),
    async autocomplete({ interaction, monsterList }) {
        const focusedValue = interaction.options.getFocused(true);
        await interaction.respond(monsterList.filter(a => a.monster_name.toLowerCase().includes(focusedValue.value.toLowerCase())).map(a => ({ name: a.monster_name, value: a.monster_name })).sort((a, b) => a.name > b.name ? 1 : -1).slice(0, 25));
    },
    async execute({ interaction, supabase, monsters, rosterChannels, Monster }) {
        await interaction.deferReply({ ephemeral: true });
        let monster = interaction.options.getString('monster');

        if (monsters[monster] == null) {
            let embed = new EmbedBuilder()
                .setTitle('Error')
                .setColor('#ff0000')
                .setDescription(`${monster} is not active`)
            return await interaction.editReply({ ephemeral: true, embeds: [embed] });
        }

        if (monsters[monster].rage) {
            let embed = new EmbedBuilder()
                .setTitle('Error')
                .setColor('#ff0000')
                .setDescription(`The ${monster} raid is already in rage mode`)
            return await interaction.editReply({ ephemeral: true, embeds: [embed] });
        }

        if (monsters[monster] == null) {
            let threads = {
                DKP: Array.from((await rosterChannels.DKP.threads.fetchActive(false)).threads.values()).concat(Array.from((await rosterChannels.DKP.threads.fetchArchived(false)).threads.values())),
                PPP: Array.from((await rosterChannels.PPP.threads.fetchActive(false)).threads.values()).concat(Array.from((await rosterChannels.PPP.threads.fetchArchived(false)).threads.values()))
            }

            let { data, error } = await supabase.from(config.supabase.tables.events).insert({
                monster_name: monster,
                start_time: new Date(timestamp * 1000),
                rage: true
            }).select('*').single();
            if (error) return interaction.editReply({ ephemeral: true, embeds: [errorEmbed(`Error creating event for ${monster}:`, error.message)] });
            event = data;

            let newMonster = new Monster(monster, timestamp, day, event.event_id, threads, true);
            monster = newMonster.name;
            monsters[monster] = newMonster;

            if (monsters[monster].thread == null) {
                monsters[monster].thread = await rosterChannels[monsters[monster].data.channel_type].threads.create({
                    name: monsters[monster].name,
                    type: ChannelType.PublicThread,
                    autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
                });
            }
            monsters[monster].message = await monsters[monster].thread.send({ embeds: monsters[monster].createEmbeds(), components: monsters[monster].createButtons() });

            ({ error } = await supabase.from(config.supabase.tables.events).update({
                channel: monsters[monster].message.channelId,
                message: monsters[monster].message.id
            }).eq('event_id', monsters[monster].event));
            if (error) return interaction.editReply({ ephemeral: true, embeds: [errorEmbed(`Error updating event for ${monster}:`, error.message)] });
            archive[monsters[monster].event] = monsters[monster];

            let embed = new EmbedBuilder()
                .setTitle('Success')
                .setColor('#00ff00')
                .setDescription(`Created a rage roster for ${monster}`)
            await interaction.editReply({ ephemeral: true, embeds: [embed] });
        } else {
            let { error } = await supabase.from(config.supabase.tables.events).update({ rage: true }).eq('event_id', monsters[monster].event);
            if (error) return await interaction.editReply({ ephemeral: true, embeds: [new errorEmbed(`Error updating ${monster} rage status`, error.message)] });
            monsters[monster].rage = true;
            await monsters[monster].message.edit({ embeds: monsters[monster].createEmbeds() });

            let embed = new EmbedBuilder()
                .setTitle('Success')
                .setColor('#00ff00')
                .setDescription(`The ${monster} raid has been updated to a rage roster`)
            await interaction.editReply({ ephemeral: true, embeds: [embed] });
        }
    }
}