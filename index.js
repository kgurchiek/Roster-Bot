const { Client, Partials, Collection, Events, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(config.supabase.url, config.supabase.key);

(async () => {
    let itemList;
    async function updateItems () {
        try {
            let { data, error } = await supabase.from(config.supabase.tables.items).select('*').eq('available', true);
            if (error == null) {
                itemList = data;
                // console.log(`[Item List]: Fetched ${itemList.length} items.`);
            } else {
                console.log('Error fetching item list:', error.message);
                await new Promise(res => setTimeout(res, 5000));
            }
        } catch (err) { console.log('Error fetching item list:', err) }
        setTimeout(updateItems);
    }
    updateItems();

    let userList;
    async function updateUsers() {
        try {
            let { data, error } = await supabase.from(config.supabase.tables.users).select('id::text, username, dkp, ppp, frozen, lifetime_dkp, lifetime_ppp');
            if (error == null) {
                userList = data;
                // console.log(`[User List]: Fetched ${userList.length} users.`);
            } else {
                console.log('Error fetching user list:', error.message);
                await new Promise(res => setTimeout(res, 5000));
            }
        } catch (err) { console.log('Error fetching user list:', err) }
        
        setTimeout(updateUsers, 2000);
    }
    updateUsers();

    let jobList;
    async function updateJobs() {
        try {
            let { data, error } = await supabase.from(config.supabase.tables.jobs).select('*');
            if (error == null) {
                jobList = data;
                // console.log(`[Job List]: Fetched ${jobList.length} jobs.`);
            } else {
                console.log('Error fetching job list:', error.message);
                await new Promise(res => setTimeout(res, 5000));
            }
        } catch (err) { console.log('Error fetching user list:', err) }
        
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
                console.log('Error fetching template list:', error.message);
                await new Promise(res => setTimeout(res, 5000));
            }
        } catch (err) { console.log('Error fetching template list:', err) }
        
        setTimeout(updateTemplates, 2000);
    }

    process.on('uncaughtException', console.error);

    const client = new Client({ partials: [Partials.Channel, Partials.GuildMember, Partials.Message], intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages] });
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
        constructor(name, timestamp, day, event) {
            this.name = name;
            this.timestamp = timestamp;
            this.day = day;
            this.signups = Array(config.roster.alliances).fill().map(() => Array(config.roster.parties).fill().map(() => []));
            this.event = event;
        }
        message;
        createEmbed() {
            return new EmbedBuilder()
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

                                if (template.role) field.value += `\n\`${template.role}\` ${this.signups[i][j][k]?.user.username || '-'}`;
                                else {
                                    let jobs = template.allowed_job_ids.map(a => {
                                        let job = jobList.find(b => b.job_id == a);
                                        if (job == null) {
                                            console.log(`Error: can't find job id: ${a}`);
                                            return null;
                                        }
                                        return `\`${job.color}${job.job_abbreviation}\``;
                                    }).filter(a => a != null);
                                    field.value += `\n${jobs.length == 0 ? '`-`' : jobs.join('/')} ${this.signups[i][j][k]?.user.username || '-'}`;
                                }
                            }

                            return field;
                        })
                    ]).reduce((a, b) => a.concat(b.reduce((c, d) => c.concat(d), [])), [])
                )
        }
    }

    let monsters = {};
    async function scheduleMonster(message) {
        let monster = message.embeds[0].title;
        let timestamp = parseInt(message.embeds[0].fields[0].value.split(':')[1]);
        let day = parseInt(message.embeds[0].fields[1].value);
        if (timestamp < Date.now() / 1000) return;
        
        let { data, error } = await supabase.from(config.supabase.tables.events).insert({
            monster_name: monster,
            start_time: new Date(timestamp * 1000)
        }).select('*').single();
        if (error != null) return console.log(`Error creating event for ${monster}:`, error.message);
        
        monsters[monster] = new Monster(monster, timestamp, day, data.event_id);
        
        let buttons = [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`quickjoin-${monster}`)
                        .setLabel('≫ Quick Join')
                        .setStyle(ButtonStyle.Success)
                    )
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`signup-select-${monster}`)
                        .setLabel('📝 Sign Up')
                        .setStyle(ButtonStyle.Primary)
                ),
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`leave-${monster}`)
                        .setLabel('✖ Leave')
                        .setStyle(ButtonStyle.Danger)
                )
        ]

        monsters[monster].message = await rosterChannel.send({ embeds: [monsters[monster].createEmbed()], components: buttons });
    }

    let guild;
    let monstersChannel;
    let rosterChannel;
    client.once(Events.ClientReady, async () => {
        console.log(`[Bot]: ${client.user.tag}`);
        console.log(`[Servers]: ${client.guilds.cache.size}`);
        guild = await client.guilds.fetch(config.discord.server);
        monstersChannel = await client.channels.fetch(config.discord.monstersChannel);
        rosterChannel = await client.channels.fetch(config.discord.rosterChannel);

        await updateJobs();
        await updateTemplates();
        let messages = Array.from((await monstersChannel.messages.fetch({ limit: 100, cache: false })).values()).filter(a => a.embeds.length > 0).reverse();
        for (let message of messages) scheduleMonster(message);
    });

    async function handleMonsters() {
        try {
            for (let monster in monsters) {
                if (monsters[monster].timestamp > Date.now() / 1000) {
                    let message = monsters[monster].message;
                    delete monsters[monster];
                }
            }
        } catch (err) { console.log('Error handling monster windows:', err.message) }
        setTimeout(handleMonsters);
    }
    // handleMonsters();

    async function getUser(id) {
        let { data: user, error } = await supabase.from(config.supabase.tables.users).select('id::text, username, dkp, ppp, frozen').eq('id', id).limit(1);
        return error ? { error } : user[0];
    }

    client.on(Events.MessageCreate, async message => {
        if (message.channelId == config.discord.monstersChannel) scheduleMonster(message);
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
                await command.execute({ interaction, client, user, supabase, itemList, userList, jobList, templateList, monsters });
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
                await command.autocomplete({ interaction, client, user, supabase, itemList, userList, jobList, templateList, monsters });
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
                if (command?.buttonHandler) command.buttonHandler({ interaction, client, user, supabase, itemList, userList, jobList, templateList, monsters });
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
                if (command?.selectHandler) command.selectHandler({ interaction, client, user, supabase, itemList, userList, jobList, templateList, monsters });
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
                if (command?.modalHandler) command.modalHandler({ interaction, client, user, supabase, itemList, userList, jobList, templateList, monsters });
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