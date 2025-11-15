const { Client, Partials, Collection, Events, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ThreadAutoArchiveDuration, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(config.supabase.url, config.supabase.key);

(async () => {
    process.on('uncaughtException', console.error);

    let monsterList;
    async function updateMonsters () {
        let hadError = false;
        try {
            let { data, error } = await supabase.from(config.supabase.tables.monsters).select('*');
            if (error == null) {
                monsterList = data;
                // console.log(`[Monster List]: Fetched ${monsterList.length} monsers.`);
            } else {
                hadError = true;
                console.log('[Monster List]: Error:', error.message);
                await new Promise(res => setTimeout(res, 5000));
            }
        } catch (err) {
            hadError = true;
            console.log('[Monster List]: Error:', err)
        }

        setTimeout(updateMonsters);
        return hadError;
    }

    let userList;
    async function updateUsers() {
        let hadError = false;
        try {
            let { data, error } = await supabase.from(config.supabase.tables.users).select('id::text, username, dkp, ppp, frozen, lifetime_dkp, lifetime_ppp');
            if (error == null) {
                userList = data;
                // console.log(`[User List]: Fetched ${userList.length} users.`);
            } else {
                hadError = true;
                console.log('[User List]: Error:', error.message);
                await new Promise(res => setTimeout(res, 5000));
            }
        } catch (err) {
            hadError = true;
            console.log('[User List]: Error:', err)
        }
        
        setTimeout(updateUsers, 2000);
        return hadError;
    }

    let jobList;
    async function updateJobs() {
        let hadError = false;
        try {
            let { data, error } = await supabase.from(config.supabase.tables.jobs).select('*');
            if (error == null) {
                jobList = data;
                // console.log(`[Job List]: Fetched ${jobList.length} jobs.`);
            } else {
                hadError = true;
                console.log('[Job List]: Error:', error.message);
                await new Promise(res => setTimeout(res, 5000));
            }
        } catch (err) {
            hadError = true;
            console.log('[Job List]: Error:', err)
        }
        
        setTimeout(updateJobs, 2000);
        return hadError;
    }

    let templateList;
    async function updateTemplates() {
        let hadError = false;
        try {
            let { data, error } = await supabase.from(config.supabase.tables.templates).select('*');
            if (error == null) {
                templateList = data;
                // console.log(`[Template List]: Fetched ${templateList.length} templates.`);
            } else {
                hadError = true;
                console.log('[Template List]: Error:', error.message);
                await new Promise(res => setTimeout(res, 5000));
            }
        } catch (err) {
            hadError = true;
            console.log('[Template List]: Error:', err)
        }
        
        setTimeout(updateTemplates, 2000);
        return hadError;
    }

    let pointRules;
    async function updatePointRules() {
        let hadError = false;
        try {
            let { data, error } = await supabase.from(config.supabase.tables.pointRules).select('*');
            if (error == null) {
                pointRules = data;
                // console.log(`[Point Rules]: Fetched ${pointRules.length} point rules.`);
            } else {
                hadError = true;
                console.log('[Point Rules]: Error:', error.message);
                await new Promise(res => setTimeout(res, 5000));
            }
        } catch (err) {
            hadError = true;
            console.log('[Point Rules]: Error:', err)
        }
        
        setTimeout(updatePointRules, 2000);
        return hadError;
    }

    let groupList;
    async function updateGroupList() {
        let hadError = false;
        try {
            let { data, error } = await supabase.from(config.supabase.tables.groups).select('*');
            if (error == null) {
                groupList = data;
                // console.log(`[Group List]: Fetched ${groupList.length} groups.`);
            } else {
                hadError = true;
                console.log('[Group List]: Error:', error.message);
                await new Promise(res => setTimeout(res, 5000));
            }
        } catch (err) {
            hadError = true;
            console.log('[Group List]: Error:', err)
        }
        
        setTimeout(updatePointRules, 2000);
        return hadError;
    }

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

    async function updateClaimRates() {
        let data;
        let error;
        ({ data, error } = await supabase.from(config.supabase.tables.claimRates).delete().gt('id', -1));
        if (error) return console.log('Error clearing claim rates:', error);

        ({ data, error } = await supabase.from(config.supabase.tables.claims).select('linkshell_name, monster_name'));
        if (error) return console.log('Error fetching claims:', error);
        let claims = data.reduce((a, b) => {
            if (!config.supabase.trackedRates.includes(b.monster_name)) return;
            b.monster_name = b.monster_name.toLowerCase().replaceAll(' ', '_');
            if (a[b.linkshell_name] == null) a[b.linkshell_name] = {};
            if (a[b.linkshell_name][b.monster_name] == null) a[b.linkshell_name][b.monster_name] = 0;
            a[b.linkshell_name][b.monster_name]++;
            return a;
        }, {});

        ({ data, error } = await supabase.from(config.supabase.tables.deaths).select('monster_name'));
        if (error) return console.log('Error fetching deaths:', error);
        let deaths = data.reduce((a, b) => {
            if (!config.supabase.trackedRates.includes(b.monster_name)) return;
            b.monster_name = b.monster_name.toLowerCase().replaceAll(' ', '_');
            if (a[b.monster_name] == null) a[b.monster_name] = 0;
            a[b.monster_name]++;
            return a;
        }, {});

        for (let team in claims) {
            for (let monster in claims[team]) claims[team][monster] /= deaths[monster];
            claims[team].linkshell_name = team;
            ({ error } = await supabase.from(config.supabase.tables.claimRates).insert(claims[team]));
            if (error) console.log('Error inserting claim rate:', error);
        }
    }
    updateClaimRates();

    class Monster {
        constructor(name, timestamp, day, event, threads, rage, thread, message, windows, killer) {
            this.name = name;
            if (this.name == 'Lord of Onzozo') {
                this.alliances = 2;
                this.placeholders = {};
            }
            this.timestamp = timestamp;
            this.day = day;
            this.event = event;
            this.rage = rage;
            this.signups = Array(this.alliances).fill().map(() => Array(this.parties).fill().map(() => Array(this.slots).fill(null)));
            
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
        alliances = config.roster.alliances;
        parties = config.roster.parties;
        slots = config.roster.slots;
        createEmbeds() {
            if (this.active) {
                let embed = new EmbedBuilder()
                    .setTitle(`🐉 ${this.name} (Day ${this.day})${this.rage ? ' (Rage)' : ''}`)
                    .setThumbnail(`https://mrqccdyyotqulqmagkhm.supabase.co/storage/v1/object/public/images//${this.name.split('(')[0].replaceAll(' ', '')}.png`)
                    .setDescription(`🕒 Starts at <t:${this.timestamp}:D> <t:${this.timestamp}:T> (<t:${this.timestamp}:R>)`)
                    .addFields(
                        ...Array(this.alliances).fill().map((a, i) => [
                            Array(this.parties).fill().map((b, j) => {
                                let field = {
                                    name: `${j == 0 ? `🛡️ Alliance ${i + 1} - ` : ''}Party ${j + 1}`,
                                    value: `(0/0)`,
                                    inline: true
                                };
                                for (let k = 0; k < this.slots; k++) {
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
                if (this.placeholders != null) {
                    let longest = Object.entries(this.placeholders).reduce((a, b) => Math.max(a, `${b[0]}: ${b[1]}`.length), 0)
                    embed.addFields(
                        {
                            name: 'Placeholders',
                            value: Object.keys(this.placeholders).length == 0 ? '​' : `\`\`\`\n${Object.entries(this.placeholders).map(a => `${a[0]}: ${a[1]}${' '.repeat(`${a[0]}: ${a[1]}`.length - longest)} | ${(a[1] % 4) * 0.2} PPP`).join('\n')}\n\`\`\``
                        }
                    )
                };
                return [embed];
            } else {
                if (this.data.signups.length == 0) {
                    return [
                        new EmbedBuilder()
                            .setTitle(`🐉 ${this.name} (Day ${this.day})${this.rage ? ' (Rage)' : ''}`)
                            .setThumbnail(`https://mrqccdyyotqulqmagkhm.supabase.co/storage/v1/object/public/images//${this.name.split('(')[0].replaceAll(' ', '')}.png`)
                            .setDescription('No participants recorded.')
                    ]
                } else {
                    return [
                        this.data.signups.filter(a => a.active),
                        this.data.signups.filter(a => !a.active).filter((a, i, arr) => arr.slice(0, i).find(b => b.signup_id == a.signup_id) == null)
                    ].filter(a => a.length > 0).map((a, i) => {
                            let embed = new EmbedBuilder()
                                .setThumbnail(`https://mrqccdyyotqulqmagkhm.supabase.co/storage/v1/object/public/images//${this.name.split('(')[0].replaceAll(' ', '')}.png`)
                            if (i == 0) embed.setTitle(`🐉 ${this.name} (Day ${this.day})${this.rage ? ' (Rage)' : ''}`);
                            embed.setDescription(`${i == 0 ? '🕒 Closed\n**Active**\n' : '**Inactive**\n'}\`\`\`\n${
                                a.map(b => `${b.verified ? '✅' : '❌'} ${b.player_id.username}${(b.windows == null || this.data.max_windows == 1) ? '' : ` - ${b.tagged == null ? '' : `${b.windows}/${this.windows}`}`}${b.tagged ? ' - T' : ''}${b.killed ? ' - K' : ''}${b.rage ? ' - R' : ''}`).join('\n')
                            }\n\`\`\``);

                            return embed;
                        }
                    )
                }
            }
        }
        createButtons() {
            return [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`quickjoin-job-${this.name}`)
                            .setLabel('≫ Quick Join')
                            .setStyle(ButtonStyle.Primary)
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
                this.name == 'Tiamat' ? new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`clear-monster-${this.name}`)
                            .setLabel('🗑️ Clear')
                            .setStyle(ButtonStyle.Secondary)
                    ) : null,
                this.placeholders == null ? null : new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`placeholder-increment-${this.name}`)
                            .setLabel('+1 Placeholder')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(`placeholder-enter-${this.name}`)
                            .setLabel('Enter Placeholders')
                            .setStyle(ButtonStyle.Secondary)
                    ),
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`populate-monster-${this.name}`)
                            .setLabel('💰 Populate')
                            .setStyle(ButtonStyle.Success)
                    )
            ].filter(a => a != null);
        }
        async close() {
            this.active = false;

            let data;
            let error;
            if (config.supabase.trackedRates.includes(this.name)) {
                ({ error } = await supabase.from(config.supabase.tables.claims).insert({ linkshell_name: this.killer, monster_name: this.name }));
                if (error) return { error };

                ({ error } = await supabase.from(config.supabase.tables.deaths).insert({ monster_name: this.name }));
                if (error) return { error };
            }

            ({ error } = await supabase.from(config.supabase.tables.events).update({ active: false }).eq('event_id', this.event));
            if (error) return { error };
            
            ({ data, error } = await supabase.from(config.supabase.tables.signups).select('signup_id, player_id (id, username), active, windows, killed, tagged, verified').eq('event_id', this.event));
            if (error) return { error };
            this.data.signups = data;
            
            let components = [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('Confirm')
                            .setStyle(ButtonStyle.Success)
                            .setCustomId(`attendance-monster-${this.archive}`)
                    )
            ]

            await this.message.edit({ embeds: this.createEmbeds(), components: this.data.signups.length > 0 ? components : [] });
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
                try {
                    await discordUser.send({ embeds: [embed], components });
                } catch (error) {
                    console.log(`Error sending dm to user ${signup.player_id}:`, error);
                }
            }

            await updateClaimRates();
        }
    }

    let monsters = {};
    let archive = [];
    async function scheduleMonster(message, events = []) {
        let monster = message.embeds[0].title;
        let timestamp = parseInt(message.embeds[0].fields[0].value.split(':')[1]);
        timestamp = (Date.now() / 1000) + 3610;
        let day = parseInt(message.embeds[0].fields[1].value);
        let delay = timestamp - (Date.now() / 1000);
        if (delay < 0) return;
        if (delay > 3600) await new Promise(res => setTimeout(res, (delay - 3600) * 1000));

        let threads = {
            DKP: Array.from((await rosterChannels.DKP.threads.fetchActive(false)).threads.values()).concat(Array.from((await rosterChannels.DKP.threads.fetchArchived(false)).threads.values())),
            PPP: Array.from((await rosterChannels.PPP.threads.fetchActive(false)).threads.values()).concat(Array.from((await rosterChannels.PPP.threads.fetchArchived(false)).threads.values()))
        }
        let event = events.find(a => a.monster_name == monster && new Date(a.start_time).getTime() / 1000 == timestamp);
        if (event == null) {
            let { data, error } = await supabase.from(config.supabase.tables.events).insert({
                monster_name: monster,
                start_time: new Date(timestamp * 1000)
            }).select('*').single();
            if (error) return console.log(`Error creating event for ${monster}:`, error.message);
            event = data;

            monsters[monster] = new Monster(monster, timestamp, day, event.event_id, threads);
        } else {
            if (!event.active) return;
            let thread;
            let message;
            if (event.channel != null) {
                try {
                    thread = await client.channels.fetch(event.channel);
                    message = await thread.messages.fetch(event.message);
                } catch (err) {
                    console.log('Error fetching previous monster message:', err);
                }
            }

            monsters[monster] = new Monster(monster, timestamp, day, event.event_id, threads, event.rage, thread, message, event.windows, event.killed_by);
            let { data, error } = await supabase.from(config.supabase.tables.signups).select('*').eq('event_id', event.event_id).eq('active', true);
            if (error) {
                console.log('Error fetching signups:', error.message);
                data = [];
            }

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
        } else await monsters[monster].message.edit({ embeds: monsters[monster].createEmbeds(), components: monsters[monster].createButtons() });
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

        let messages = Array.from((await monstersChannel.messages.fetch({ limit: 100, cache: false })).values()).filter(a => a.embeds.length > 0).reverse();

        let { data: events, error } = await supabase.from(config.supabase.tables.events).select('*');
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
                    .setColor('#190d0dff')
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
            
            let members = await guild.members.fetch();
            let guildMember = members.get(interaction.user.id);
            if (guildMember == null) {
                let errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .addFields({ name: 'Error', value: 'You must be a member of the server to use this bot.' });
                await interaction.editReply({ embeds: [errorEmbed], components: [] });
                return;
            }
            
            try {
                await command.execute({ interaction, client, user, supabase, monsterList, userList, jobList, templateList, pointRules, groupList, monsters, archive, rosterChannels, Monster });
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
                await command.autocomplete({ interaction, client, user, supabase, monsterList, userList, jobList, templateList, pointRules, groupList, monsters, archive, rosterChannels, Monster });
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
                if (command?.buttonHandler) command.buttonHandler({ interaction, client, user, supabase, monsterList, userList, jobList, templateList, pointRules, groupList, monsters, archive, rosterChannels, Monster });
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
                if (command?.selectHandler) command.selectHandler({ interaction, client, user, supabase, monsterList, userList, jobList, templateList, pointRules, groupList, monsters, archive, rosterChannels, Monster });
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
                if (command?.modalHandler) command.modalHandler({ interaction, client, user, supabase, monsterList, userList, jobList, templateList, pointRules, groupList, monsters, archive, rosterChannels, Monster });
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

    (async () => {
        if (
            await updateMonsters() ||
            await updateUsers() ||
            await updateJobs() ||
            await updateTemplates() ||
            await updatePointRules() ||
            await updateGroupList()
        ) process.exit();
        client.login(config.discord.token);
    })()
})();