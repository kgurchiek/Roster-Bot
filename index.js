const { Client, Partials, Collection, Events, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ThreadAutoArchiveDuration, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(config.supabase.url, config.supabase.key);

(async () => {
    let monsterList;
    async function updateMonsters () {
        try {
            let { data, error } = await supabase.from(config.supabase.tables.monsters).select('*');
            if (error == null) {
                monsterList = data;
                // console.log(`[Monster List]: Fetched ${monsterList.length} monsers.`);
            } else {
                console.log('[Monster List]: Error:', error.message);
                await new Promise(res => setTimeout(res, 5000));
            }
        } catch (err) { console.log('[Monster List]: Error:', err) }
        setTimeout(updateMonsters);
    }

    let userList;
    async function updateUsers() {
        try {
            let { data, error } = await supabase.from(config.supabase.tables.users).select('id::text, username, dkp, ppp, frozen, lifetime_dkp, lifetime_ppp');
            if (error == null) {
                userList = data;
                // console.log(`[User List]: Fetched ${userList.length} users.`);
            } else {
                console.log('[User List]: Error:', error.message);
                await new Promise(res => setTimeout(res, 5000));
            }
        } catch (err) { console.log('[User List]: Error:', err) }
        
        setTimeout(updateUsers, 2000);
    }

    let jobList;
    async function updateJobs() {
        try {
            let { data, error } = await supabase.from(config.supabase.tables.jobs).select('*');
            if (error == null) {
                jobList = data;
                // console.log(`[Job List]: Fetched ${jobList.length} jobs.`);
            } else {
                console.log('[Job List]: Error:', error.message);
                await new Promise(res => setTimeout(res, 5000));
            }
        } catch (err) { console.log('[Job List]: Error:', err) }
        
        setTimeout(updateJobs, 2000);
    }

    let templateList;
    async function updateTemplates() {
        try {
            let { data, error } = await supabase.from(config.supabase.tables.templates).select('*');
            if (error == null) {
                templateList = data;
                // console.log(`[Template List]: Fetched ${templateList.length} templates.`);
            } else {
                console.log('[Template List]: Error:', error.message);
                await new Promise(res => setTimeout(res, 5000));
            }
        } catch (err) { console.log('[Template List]: Error:', err) }
        
        setTimeout(updateTemplates, 2000);
    }

    let pointRules;
    async function updatePointRules() {
        try {
            let { data, error } = await supabase.from(config.supabase.tables.pointRules).select('*');
            if (error == null) {
                pointRules = data;
                // console.log(`[Point Rules]: Fetched ${pointRules.length} point rules.`);
            } else {
                console.log('[Point Rules]: Error:', error.message);
                await new Promise(res => setTimeout(res, 5000));
            }
        } catch (err) { console.log('[Point Rules]: Error:', err) }
        
        setTimeout(updatePointRules, 2000);
    }

    let groupList;
    async function updateGroupList() {
        try {
            let { data, error } = await supabase.from(config.supabase.tables.groups).select('*');
            if (error == null) {
                groupList = data;
                // console.log(`[Group List]: Fetched ${groupList.length} groups.`);
            } else {
                console.log('[Group List]: Error:', error.message);
                await new Promise(res => setTimeout(res, 5000));
            }
        } catch (err) { console.log('[Group List]: Error:', err) }
        
        setTimeout(updatePointRules, 2000);
    }

    process.on('uncaughtException', console.error);

    const client = new Client({
        partials: [
            Partials.Channel,
            Partials.GuildMember,
            Partials.Message
        ],
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessages
        ]
    });
    client.commands = new Collection();
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        client.commands.set(command.data.name, command);
        console.log(`[Loaded]: ${file}`);
    }

    class Monster {
        constructor(name, timestamp, day, event, threads, thread, message, windows, killer) {
            this.name = name;
            this.timestamp = timestamp;
            this.day = day;
            this.event = event;
            this.signups = Array(config.roster.alliances).fill().map(() => Array(config.roster.parties).fill().map(() => Array(config.roster.slots).fill(null)));
            
            this.thread = thread;
            this.message = message;
            this.windows = windows;
            this.killer = killer;

            this.data = monsterList.find(a => a.monster_name == this.name);
            if (this.data == null) console.log(`Error: could not find data for monster "${this.name}"`);
            else if (thread == null) {
                let group = config.discord.threadGroups.find(a => a.includes(this.name));
                if (group) this.thread = threads[this.data.channel_type].find(a => a.name == group.join('/'));
                else this.thread = threads[this.data.channel_type].find(a => a.name == this.name);
            }
        }
        active = true;
        createEmbeds() {
            if (this.active) {
                if (false && this.name == 'Lord of Onzozo') {
                    // TODO
                } else {
                    return [
                        new EmbedBuilder()
                            .setTitle(`🐉 ${this.name} (Day ${this.day})`)
                            .setDescription(`🕒 Starts at <t:${this.timestamp}:D> <t:${this.timestamp}:T> (<t:${this.timestamp}:R>)`)
                            .addFields(
                                ...Array(config.roster.alliances).fill().map((a, i) => [
                                    Array(config.roster.parties).fill().map((b, j) => {
                                        let field = {
                                            name: `${j == 0 ? `🛡️ Alliance ${i + 1} - ` : ''}Party ${j + 1}`,
                                            value: `(0/0)`,
                                            inline: true
                                        };
                                        for (let k = 0; k < config.roster.slots; k++) {
                                            let template = templateList.find(a => a.monster_name == this.name && a.alliance_number == i + 1 && a.party_number == j + 1 && a.party_slot_number == k + 1);
                                            if (template == null) {
                                                console.log(`Error: Cannot find template for ${this.name}, Alliance ${i + 1}, Party ${j + 1}, Slot ${k + 1}`);
                                                template = { allowed_job_ids: [] };
                                            }

                                            let role;
                                            let username = '-';
                                            if (this.signups[i][j][k] != null) {
                                                let job = jobList.find(a => a.job_id == this.signups[i][j][k].job);
                                                if (job == null) console.log(`Error: can't find job id: ${a}`);
                                                else {
                                                    role = `\`${job.color}${job.job_abbreviation}\``;
                                                    username = this.signups[i][j][k].user.username;
                                                }
                                            }
                                            if (role == null) {
                                                if (template.role == null) {
                                                    let jobs = template.allowed_job_ids.map(a => {
                                                        let job = jobList.find(b => b.job_id == a);
                                                        if (job == null) {
                                                            console.log(`Error: can't find job id: ${a}`);
                                                            return null;
                                                        }
                                                        return `${job.color}${job.job_abbreviation}`;
                                                    }).filter(a => a != null);
                                                    role = jobs.length == 0 ? '`-`' : jobs.join('/');
                                                } else role = template.role;
                                            }

                                            field.value += `\n\`${role}\` ${username}`;
                                        }

                                        return field;
                                    })
                                ]).reduce((a, b) => a.concat(b.reduce((c, d) => c.concat(d), [])), [])
                            )
                    ];
                }
            } else {
                return [
                    this.data.signups.filter(a => a.active),
                    this.name == 'Tiamat' ? null : this.signups.filter(a => !a.active).filter((a, i, arr) => arr.slice(0, i).find(b => b.signup_id == a.signup_id) == null)
                ].filter(a => a != null).map((a, i) => {
                        let embed = new EmbedBuilder()
                        if (i == 0) embed.setTitle(`🐉 ${this.name} (Day ${this.day})`);
                        embed.setDescription(`${i == 0 ? '🕒 Closed\n**Active**\n' : '**Inactive**\n'}\`\`\`\n${
                            a.map(b => `${b.verified ? '✅' : '❌'} ${b.player_id.username} - ${b.windows == null ? '' : `${b.windows}/${this.windows}`}${b.tagged ? ' - T' : ''}${b.killed ? ' - K' : ''}`).join('\n')
                        }\n\`\`\``);

                        return embed;
                    }
                )
            }
        }
        createButtons() {
            return [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`quickjoin-job-${this.name}`)
                            .setLabel('≫ Quick Join')
                            .setStyle(ButtonStyle.Success)
                        )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`signup-select-${this.name}`)
                            .setLabel('📝 Sign Up')
                            .setStyle(ButtonStyle.Primary)
                    ),
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`leave-monster-${this.name}`)
                            .setLabel('✖ Leave')
                            .setStyle(ButtonStyle.Danger)
                    ),
                this.name == 'Tiamat' ? (new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`clear-monster-${this.name}`)
                            .setLabel('🗑️ Clear')
                            .setStyle(ButtonStyle.Secondary)
                    )) : null,
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`populate-monster-${this.name}`)
                            .setLabel('💰 Populate')
                            .setStyle(ButtonStyle.Secondary)
                    )
            ].filter(a => a != null);
        }
        async close() {
            this.active = false;

            let { error } = await supabase.from(config.supabase.tables.events).update({ active: false }).eq('event_id', this.event);
            if (error) return { error };
            
            let data;
            ({ data, error } = await supabase.from(config.supabase.tables.signups).select('signup_id, player_id (id, username), active, windows, killed, tagged, verified').eq('event_id', this.event));
            if (error) return { error };
            this.data.signups = data;
            
            await this.message.edit({ embeds: this.createEmbeds(), components: [] });
            delete monsters[this.name];

            for (let signup of this.data.signups.filter(a => a.active)) {
                let user = signup.player_id;
                if (this.name == 'Tiamat') signup.windows = this.data.signups.filter(a => a.id == user.id).length;
                let discordUser = client.users.cache.get(user.id);
                let embed = new EmbedBuilder()
                    .setTitle('Confirm Attendance')
                    .setColor('#ffff00')
                    .setDescription(`The ${this.name} raid has been closed, click the button below to confirm your attendance`)
                let components = [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('Confirm')
                                .setStyle(ButtonStyle.Success)
                                .setCustomId(`attendance-monster-${this.archive}-${signup.signup_id}`)
                        )
                ]
                await discordUser.send({ embeds: [embed], components });
            }
        }
    }

    let monsters = {};
    let archive = [];
    async function scheduleMonster(message, events = []) {
        let monster = message.embeds[0].title;
        let timestamp = parseInt(message.embeds[0].fields[0].value.split(':')[1]);
        let day = parseInt(message.embeds[0].fields[1].value);
        if (timestamp < Date.now() / 1000) return;

        let threads = {
            DKP: Array.from((await rosterChannels.DKP.threads.fetchActive(false)).threads.values()).concat(Array.from((await rosterChannels.DKP.threads.fetchArchived(false)).threads.values())),
            PPP: Array.from((await rosterChannels.PPP.threads.fetchActive(false)).threads.values()).concat(Array.from((await rosterChannels.PPP.threads.fetchArchived(false)).threads.values()))
        }
        let event = events.find(a => new Date(a.start_time).getTime() / 1000 == timestamp);
        if (event == null) {
            let { data, error } = await supabase.from(config.supabase.tables.events).insert({
                monster_name: monster,
                start_time: new Date(timestamp * 1000)
            }).select('*').single();
            if (error != null) return console.log(`Error creating event for ${monster}:`, error.message);
            event = data;

            monsters[monster] = new Monster(monster, timestamp, day, event.event_id, threads);
        } else {
            let thread;
            let message;
            try {
                thread = await client.channels.fetch(event.channel);
                message = await thread.fetch(event.message);
            } catch (err) {
                console.log('Error fetching previous monster message:', err);
            }

            monsters[monster] = new Monster(monster, timestamp, day, event.event_id, threads, thread, message, event.windows, event.killed_by);
            let { data, error } = await supabase.from(config.supabase.tables.signups).select('*').eq('event_id', event.event_id).eq('active', true);
            if (error) console.log('Error fetching signups:', error.message);

            for (let signup of data) {
                let template = templateList.find(a => a.id == signup.slot_template_id);
                if (template == null) {
                    console.log(`Error: couldn't find template with id "${signup.slot_template_id}"`)
                    continue;
                }

                let user;
                try {
                    user = await client.users.fetch(signup.player_id);
                } catch (error) {
                    console.log(`Error: couldn't fetch user with id "${signup.player_id}"`);
                    continue;
                }

                let job = jobList.find(a => a.job_id == signup.assigned_job_id);
                if (job == null) {
                    console.log(`Error: couldn't find job with id "${signup.assigned_job_id}"`)
                    continue;
                }
                monsters[monster].signups[signup.alliance_number][signup.party_number][signup.party_slot_number] = {
                    user,
                    job
                };
            }
        }

        if (monsters[monster].message == null) {
            if (monsters[monster].thread == null) {
                let group = config.discord.threadGroups.find(a => a.includes(monster));
                monsters[monster].thread = await rosterChannels[monsters[monster].data.channel_type].threads.create({
                    name: group ? group.join('/') : monsters[monster].name,
                    type: ChannelType.PublicThread,
                    autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
                });
            }
            monsters[monster].message = await monsters[monster].thread.send({ embeds: monsters[monster].createEmbeds(), components: monsters[monster].createButtons() });

            let { error } = await supabase.from(config.supabase.tables.events).update({
                channel: monsters[monster].message.channelId,
                message: monsters[monster].message.id
            }).eq('event_id', monsters[monster].event);
            if (error) console.log('Error updating event:', error.message);
        }
        monsters[monster].archive = archive.push(monsters[monster]) - 1;   
    }

    let guild;
    let monstersChannel;
    let rosterChannels;
    client.once(Events.ClientReady, async () => {
        console.log(`[Bot]: ${client.user.tag}`);
        console.log(`[Servers]: ${client.guilds.cache.size}`);
        guild = await client.guilds.fetch(config.discord.server);
        monstersChannel = await client.channels.fetch(config.discord.monstersChannel);
        rosterChannels = {
            DKP: await client.channels.fetch(config.discord.rosterChannel.DKP),
            PPP: await client.channels.fetch(config.discord.rosterChannel.PPP)
        }

        await updateMonsters();
        await updateUsers();
        await updateJobs();
        await updateTemplates();
        await updatePointRules();
        await updateGroupList();
        let messages = Array.from((await monstersChannel.messages.fetch({ limit: 100, cache: false })).values()).filter(a => a.embeds.length > 0).reverse();

        let { data: events, error } = await supabase.from(config.supabase.tables.events).select('*').eq('active', true);
        if (error) {
            console.log('Error fetching events:', error.message);
            data = [];
        }

        for (let message of messages) scheduleMonster(message, events);
    });

    async function getUser(id) {
        let { data: user, error } = await supabase.from(config.supabase.tables.users).select('id::text, username, dkp, ppp, frozen').eq('id', id).limit(1);
        return error ? { error } : user[0];
    }

    client.on(Events.MessageCreate, async message => {
        if (message.channelId == config.discord.monstersChannel) if (message.embeds.length > 0) scheduleMonster(message);
    })

    client.on(Events.InteractionCreate, async interaction => {
        let user = await getUser(interaction.user.id);
        if (!interaction.isAutocomplete()) {
            if (user == null) {
                let errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .addFields({ name: 'Error', value: 'User not found.' });
                await interaction.reply({ embeds: [errorEmbed], components: [], ephemeral: true });
                return;
            }
            if (user.error) {
                console.log(error);
                let errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .addFields({ name: 'Error', value: `Error fetching user data: ${error.message}` });
                await interaction.editReply({ embeds: [errorEmbed], components: [], ephemeral: true });
                return;
            }
        }

        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            await interaction.deferReply({ ephemeral: command.ephemeral });
            
            let members = await guild.members.fetch();
            let guildMember = members.get(interaction.user.id);
            if (guildMember == null) {
                let errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .addFields({ name: 'Error', value: 'You must be a member of the server to use this bot.' });
                await interaction.editReply({ embeds: [errorEmbed], components: [] });
                return;
            }
            
            if (user != null) {
                user.staff = false;
                for (const role of config.discord.staffRoles) if (guildMember.roles.cache.get(role)) user.staff = true;
            }
            
            try {
                await command.execute({ interaction, client, user, supabase, monsterList, userList, jobList, templateList, pointRules, groupList, monsters, archive });
            } catch (error) {
                console.log(error);
                var errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Error Executing Command')
                    .setDescription(String(error.message))
                try {
                    await interaction.editReply({ embeds: [errorEmbed], components: [] })
                } catch (e) {}
            }
        }
        if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.autocomplete({ interaction, client, user, supabase, monsterList, userList, jobList, templateList, pointRules, groupList, monsters, archive });
            } catch (error) {
                console.log(error);
                try {
                    await interaction.respond([{ name: `[ERROR]: ${error.message}`.slice(0, 100), value: '​' }]);
                } catch (e) {}
            }
        }
        if (interaction.isButton()) {
            const command = client.commands.get(interaction.customId.split('-')[0]);
            try {
                if (command?.buttonHandler) command.buttonHandler({ interaction, client, user, supabase, monsterList, userList, jobList, templateList, pointRules, groupList, monsters, archive });
            } catch (error) {
                console.log(error);
                var errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Error Executing Command')
                    .setDescription(String(error.message))
                try {
                    await interaction.editReply({ embeds: [errorEmbed], components: [] })
                } catch (e) {}
            }
        }
        if (interaction.isAnySelectMenu()) {
            const command = client.commands.get(interaction.customId.split('-')[0]);
            try {
                if (command?.selectHandler) command.selectHandler({ interaction, client, user, supabase, monsterList, userList, jobList, templateList, pointRules, groupList, monsters, archive });
            } catch (error) {
                console.log(error);
                var errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Error Executing Command')
                    .setDescription(String(error.message))
                try {
                    await interaction.editReply({ embeds: [errorEmbed], components: [] })
                } catch (e) {}
            }
        }
        if (interaction.isModalSubmit()) {
            const command = client.commands.get(interaction.customId.split('-')[0]);
            if (command == null) {
                console.log(`Unknown command "${interaction.customId.split('-')[0]}"`);
                return;
            }
            try {
                if (command?.modalHandler) command.modalHandler({ interaction, client, user, supabase, monsterList, userList, jobList, templateList, pointRules, groupList, monsters, archive });
            } catch (error) {
                console.log(error);
                var errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('Error Executing Command')
                    .setDescription(String(error.message))
                try {
                    await interaction.editReply({ embeds: [errorEmbed], components: [] })
                } catch (e) {}
            }
        }
    });

    client.login(config.discord.token);
})();