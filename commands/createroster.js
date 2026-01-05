const { SlashCommandBuilder, EmbedBuilder, time } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createroster')
        .setDescription('Opens a roster for a user')
        .addStringOption(option =>
            option.setName('monster')
                .setDescription('the monster to open a roster for')
                .setAutocomplete(true)
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option.setName('rage')
                .setDescription('whether or not it\'s a rage roster')
        ),
    async autocomplete({ config, interaction, monsterList }) {
        const focusedValue = interaction.options.getFocused(true);
        await interaction.respond(monsterList.filter(a => a.monster_name.toLowerCase().includes(focusedValue.value.toLowerCase())).map(a => ({ name: a.monster_name, value: a.monster_name })).sort((a, b) => a.name > b.name ? 1 : -1).slice(0, 25));
    },
    async execute({ config, interaction, supabase, monsters, rosterChannels, logChannel, Monster, eventList, archive }) {
        await interaction.deferReply({ ephemeral: true });
        let monster = interaction.options.getString('monster');
        let rage = interaction.options.getBoolean('rage');

        if (rage && monsters[monster]?.rage) {
            let embed = new EmbedBuilder()
                .setTitle('Error')
                .setColor('#ff0000')
                .setDescription(`The ${monster} raid is already open in rage mode`)
            return await interaction.editReply({ ephemeral: true, embeds: [embed] });
        }

        if (monsters[monster] == null) {
            let threads = {
                DKP: Array.from((await rosterChannels.DKP.threads.fetchActive(false)).threads.values()).concat(Array.from((await rosterChannels.DKP.threads.fetchArchived(false)).threads.values())),
                PPP: Array.from((await rosterChannels.PPP.threads.fetchActive(false)).threads.values()).concat(Array.from((await rosterChannels.PPP.threads.fetchArchived(false)).threads.values()))
            }

            let lastEvent = eventList.filter(a => a.monster_name == monster).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())[0];
            let timestamp = lastEvent == null ? Math.floor(Date.now() / 1000) + 60 * 60 : Math.floor(new Date(lastEvent.start_time).getTime() / 1000);
            let day = lastEvent?.day || 0;
            let { data, error } = await supabase.from(config.supabase.tables.events).insert({
                monster_name: monster,
                start_time: new Date(timestamp * 1000),
                rage
            }).select('*').single();
            if (error) return interaction.editReply({ ephemeral: true, embeds: [errorEmbed(`Error creating event for ${monster}:`, error.message)] });
            event = data;

            let newMonster = new Monster(monster, timestamp, day, event.event_id, threads, true);
            monster = newMonster.name;
            monsters[monster] = newMonster;

            if (monsters[monster].thread == null) {
                monsters[monster].thread = await rosterChannels[monsters[monster].data.channel_type].threads.create({
                    name: monsters[monster].group ? monsters[monster].group.map(a => a).join('/') : monsters[monster].name,
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
                .setDescription(`Created a${rage ? ' rage' : ''} roster for ${monster}`)
            await logChannel.send({ embeds: [embed] });
            embed.setTitle('Success');
            embed.setColor('#00ff00');
            await interaction.editReply({ ephemeral: true, embeds: [embed] });
        } else {
            let { error } = await supabase.from(config.supabase.tables.events).update({ rage: true }).eq('event_id', monsters[monster].event);
            if (error) return await interaction.editReply({ ephemeral: true, embeds: [new errorEmbed(`Error updating ${monster} rage status`, error.message)] });
            monsters[monster].rage = rage;
            await monsters[monster].message.edit({ embeds: monsters[monster].createEmbeds() });

            let embed = new EmbedBuilder()
                .setDescription(`The ${monster} raid has been updated`)
            await logChannel.send({ embeds: [embed] });
            embed.setTitle('Success');
            embed.setColor('#00ff00');
            await interaction.editReply({ ephemeral: true, embeds: [embed] });
        }
    }
}