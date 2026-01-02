const { Client, Partials, Collection, Events, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ThreadAutoArchiveDuration, ChannelType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(config.supabase.url, config.supabase.key);

(async () => {
    process.on('uncaughtException', console.error);

    let monsterList;
    async function updateMonsters() {
        let hadError = false;
        try {
            let { data, error } = await supabase.from(config.supabase.tables.monsters).select('*');
            if (error == null) {
                monsterList = data;
                // console.log(`[Monster List]: Fetched ${monsterList.length} monsers.`);
            } else {
                hadError = true;
                console.log('[Monster List]: Error:', error.message == null ? '' : (error.message.includes('<!DOCTYPE html>') || error.message.includes('<html>')) ? 'Server Error' : error.message);
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
            let { data, error } = await supabase.from(config.supabase.tables.users).select('*');
            if (error == null) {
                userList = data;
                // console.log(`[User List]: Fetched ${userList.length} users.`);
            } else {
                hadError = true;
                console.log('[User List]: Error:', error.message == null ? '' : (error.message.includes('<!DOCTYPE html>') || error.message.includes('<html>')) ? 'Server Error' : error.message);
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
                console.log('[Job List]: Error:', error.message == null ? '' : (error.message.includes('<!DOCTYPE html>') || error.message.includes('<html>')) ? 'Server Error' : error.message);
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
                console.log('[Template List]: Error:', error.message == null ? '' : (error.message.includes('<!DOCTYPE html>') || error.message.includes('<html>')) ? 'Server Error' : error.message);
                await new Promise(res => setTimeout(res, 5000));
            }
        } catch (err) {
            hadError = true;
            console.log('[Template List]: Error:', err)
        }
        
        setTimeout(updateTemplates, 2000);
        return hadError;
    }

    let campRules;
    async function updateCampRules() {
        let hadError = false;
        try {
            let { data, error } = await supabase.from(config.supabase.tables.campRules).select('*');
            if (error == null) {
                campRules = data;
                // console.log(`[Camp Rules]: Fetched ${campRules.length} point rules.`);
            } else {
                hadError = true;
                console.log('[Point Rules]: Error:', error.message == null ? '' : (error.message.includes('<!DOCTYPE html>') || error.message.includes('<html>')) ? 'Server Error' : error.message);
                await new Promise(res => setTimeout(res, 5000));
            }
        } catch (err) {
            hadError = true;
            console.log('[Camp Rules]: Error:', err)
        }
        
        setTimeout(updateCampRules, 2000);
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
                console.log('[Point Rules]: Error:', error.message == null ? '' : (error.message.includes('<!DOCTYPE html>') || error.message.includes('<html>')) ? 'Server Error' : error.message);
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
                console.log('[Group List]: Error:', error.message == null ? '' : (error.message.includes('<!DOCTYPE html>') || error.message.includes('<html>')) ? 'Server Error' : error.message);
                await new Promise(res => setTimeout(res, 5000));
            }
        } catch (err) {
            hadError = true;
            console.log('[Group List]: Error:', err)
        }
        
        setTimeout(updateGroupList, 2000);
        return hadError;
    }

    let tagList;
    async function updateTagList() {
        let hadError = false;
        try {
            let { data, error } = await supabase.from(config.supabase.tables.tags).select('*');
            if (error == null) {
                tagList = data;
                // console.log(`[Tag List]: Fetched ${tagList.length} tag records.`);
            } else {
                hadError = true;
                console.log('[Tag List]: Error:', error.message == null ? '' : (error.message.includes('<!DOCTYPE html>') || error.message.includes('<html>')) ? 'Server Error' : error.message);
                await new Promise(res => setTimeout(res, 5000));
            }
        } catch (err) {
            hadError = true;
            console.log('[Tag List]: Error:', err)
        }
        
        setTimeout(updateTagList, 2000);
        return hadError;
    }

    let lootHistory = {};
    async function updateLootHistory() {
        let hadError = false;
        try {
            let { data, error } = await supabase.from(config.supabase.tables.lootHistory.DKP).select('*');
            if (error == null) {
                lootHistory.DKP = data;
                // console.log(`[Loot History]: Fetched ${lootHistory.length} dkp items.`);
            } else {
                hadError = true;
                console.log('[Loot History]: Error:', error.message == null ? '' : (error.message.includes('<!DOCTYPE html>') || error.message.includes('<html>')) ? 'Server Error' : error.message);
                await new Promise(res => setTimeout(res, 5000));
            }

            ({ data, error } = await supabase.from(config.supabase.tables.lootHistory.PPP).select('*'));
            if (error == null) {
                lootHistory.PPP = data;
                // console.log(`[Loot History]: Fetched ${lootHistory.length} ppp items.`);
            } else {
                hadError = true;
                console.log('[Loot History]: Error:', error.message == null ? '' : (error.message.includes('<!DOCTYPE html>') || error.message.includes('<html>')) ? 'Server Error' : error.message);
                await new Promise(res => setTimeout(res, 5000));
            }
        } catch (err) {
            hadError = true;
            console.log('[Loot History]: Error:', err)
        }
        
        setTimeout(updateLootHistory, 2000);
        return hadError;
    }

    let eventList;
    async function updateEventList() {
        let hadError = false;
        try {
            let { data, error } = await supabase.from(config.supabase.tables.events).select('*');
            if (error == null) {
                eventList = data;
                // console.log(`[Tag List]: Fetched ${eventList.length} events.`);
            } else {
                hadError = true;
                console.log('[Tag List]: Error:', error.message == null ? '' : (error.message.includes('<!DOCTYPE html>') || error.message.includes('<html>')) ? 'Server Error' : error.message);
                await new Promise(res => setTimeout(res, 5000));
            }
        } catch (err) {
            hadError = true;
            console.log('[Tag List]: Error:', err);
        }
        
        setTimeout(updateEventList, 2000);
        return hadError;
    }

    let signupList;
    async function updateSignupList() {
        let hadError = false;
        try {
            let { data, error } = await supabase.from(config.supabase.tables.signups).select('*, event_id (event_id, monster_name), player_id (id, username)');
            if (error == null) {
                signupList = data;
                // console.log(`[Signup List]: Fetched ${signupList.length} signups.`);
            } else {
                hadError = true;
                console.log('[Signup List]: Error:', error.message == null ? '' : (error.message.includes('<!DOCTYPE html>') || error.message.includes('<html>')) ? 'Server Error' : error.message);
                await new Promise(res => setTimeout(res, 5000));
            }
        } catch (err) {
            hadError = true;
            console.log('[Signup List]: Error:', err);
        }
        
        setTimeout(updateSignupList, 2000);
        return hadError;
    }

    async function updateGraphs() {
        let { data: allSignups, error } = await supabase.from(config.supabase.tables.signups).select('*, event_id (event_id, monster_name), player_id (id, username)');
        if (error) {
            console.log('[Graphs]: Error:', (error.message.includes('<!DOCTYPE html>') || error.message.includes('<html>')) ? 'Server Error' : error.message);
            await new Promise(res => setTimeout(res, 5000));            
        } else {
            // console.log(`[Graphs]: Fetched ${signups.length} signups.`);
            allSignups = allSignups.filter(a => new Date(a.date).getTime() > Date.now() - (30 * 24 * 60 * 60 * 1000));
            let monsters = allSignups.map(a => a.event_id.monster_name).filter((a, i, arr) => !arr.slice(0, i).includes(a)).filter((a, i, arr) => {
                let group = config.roster.monsterGroups.find(b => b.includes(a));
                if (group == null) return true;
                return arr.slice(0, i).find(b => group.includes(b)) == null;
            });

            let embeds = { DKP: [], PPP: [] };
            monsters.forEach(async a => {
                let monster = monsterList.find(b => b.monster_name == a);
                if (monster == null) return console.log(`[Graphs]: Couldn't find data for monster "${a}"`);
                let group = config.roster.monsterGroups.find(b => b.includes(a)) || [monster.monster_name];
                let signups = allSignups.filter(a => group.includes(a.event_id.monster_name));
                let graph = {
                    type: 'line',
                    data: {
                        labels: Array(30).fill(null).map((a, i) => {
                            let date = new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000);
                            return `${date.getDate()}/${date.getMonth() + 1}`;
                        }),
                        datasets: [
                            {
                                data: Array(31).fill(0),
                                fill: true,
                                borderColor: config.graph.lineColor,
                                backgroundColor: config.graph.lineFillColor,
                                pointRadius: 0,
                            }
                        ]
                    },
                    options: {
                        legend: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: ''
                        },
                        scales: {
                            yAxes: [
                                {
                                    gridLines: {
                                        display: true,
                                        color: config.graph.fontColor
                                    },
                                    ticks: {
                                        precision: 0,
                                        beginAtZero: true,
                                        fontColor: config.graph.fontColor,
                                    },
                                    scaleLabel: {
                                        display: true,
                                        labelString: 'Signups',
                                        fontColor: config.graph.fontColor
                                    }
                                }
                            ],
                            xAxes: [
                                {
                                    ticks: {
                                        precision: 0,
                                        beginAtZero: true,
                                        fontColor: config.graph.fontColor,
                                    }
                                }
                            ]
                        }
                    }
                }
                signups.forEach(signup => {
                    let day = Math.floor((new Date(signup.date).getTime() - (Date.now() - (30 * 24 * 60 * 60 * 1000))) / (24 * 60 * 60 * 1000));
                    graph.data.datasets[0].data[day]++;
                });
                let url = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(graph))}&backgroundColor=${encodeURIComponent(config.graph.backgroundColor)}`;
                let embed = new EmbedBuilder()
                    .setTitle(group.join('/'))
                    .setDescription(`<t:${Math.floor(Date.now() / 1000)}:d>`)
                    .setImage(url);
                try {
                    embeds[monster.channel_type].push(embed);
                } catch (err) {
                    console.log('[Graphs]: Error sending message:', err);
                }
            })

            let dkpMessages = Array.from((await graphChannels.DKP.messages.fetch({ limit: 100, cache: false })).values()).filter(a => a.author.id == client.user.id);
            let pppMessages = Array.from((await graphChannels.PPP.messages.fetch({ limit: 100, cache: false })).values()).filter(a => a.author.id == client.user.id);
            for (let message of dkpMessages.slice(embeds.DKP.length)) await message.delete();
            for (let message of pppMessages.slice(embeds.PPP.length)) await message.delete();
            embeds.DKP.forEach(async (a, i) => {
                if (dkpMessages[i]) await dkpMessages[i].edit({ content: '', embeds: [a], components: [] });
                else await graphChannels.DKP.send({ embeds: [a] });
            })
            embeds.PPP.forEach(async (a, i) => {
                if (pppMessages[i]) await pppMessages[i].edit({ content: '', embeds: [a], components: [] });
                else await graphChannels.PPP.send({ embeds: [a] });
            })
        }

        setTimeout(updateGraphs, 60 * 60 * 1000);
        return ;
    }

    async function updateUserTable() {
        let signups = signupList.filter((a, i) => signupList.slice(0, i).find(b => b.event_id.event_id == a.event_id.event_id && b.player_id.id == a.player_id.id) == null);
        let lines = [['User'].concat(config.supabase.trackedRates.map(a => `${a.slice(0, 3)}${a.length > 3 ? '.' : ''}`))];
        let longest = lines[0].slice(0, -1).map(a => a.length);
        for (let user of userList) {
            let displayName = user.username.split('(')[0].trim();
            let line = [displayName.length > 6 ? `${displayName.slice(0, 5)}.` : displayName].concat(config.supabase.trackedRates.map(a => `${(((signups.filter(b => b.event_id.monster_name == a && b.player_id.id == user.id).length / eventList.filter(b => b.monster_name == a).length) || 0) * 100).toFixed(0)}%`));
            line.forEach((a, i) => longest[i] = Math.max(longest[i] || 0, a.length));
            lines.push(line);
        }
        let embeds = [
            new EmbedBuilder()
                .setTitle('User Attendance')
                .setDescription('```\n')
        ]
        for (let line of lines) {
            let newDescription = line.map((a, i) => `${a}${i < line.length - 1 ? ' '.repeat(longest[i] - a.length) : ''}`).join(' | ');
            if (`${embeds[embeds.length - 1].data.description}\n${newDescription}`.length > 4092) {
                embeds[embeds.length - 1].data.description += '\n```'
                embeds.push(new EmbedBuilder().setDescription('```\n'));
            }
            embeds[embeds.length - 1].data.description += `\n${newDescription}`;
        }
        embeds[embeds.length - 1].data.description += '\n```'
        let messages = Array.from((await userAttendanceChannel.messages.fetch({ limit: 100, cache: false })).values()).filter(a => a.author.id == client.user.id).reverse();
        for (let message of messages.slice(embeds.length)) await message.delete();
        
        embeds.forEach(async (a, i) => {
            if (messages[i]) await messages[i].edit({ content: '', embeds: [a], components: [] })
            else await userAttendanceChannel.send({ embeds: [a] });
        })

        setTimeout(updateUserTable, 60 * 1000);
    }

    async function updateLootHistoryTable() {
        let embeds = {
            DKP: [
                new EmbedBuilder()
                    .setTitle('Loot History')
                    .setDescription('```\n')
            ],
            PPP: [
                new EmbedBuilder()
                    .setTitle('Loot History')
                    .setDescription('```\n')
            ]
        }
     	for (let user of userList.sort((a, b) => a.username > b.username ? 1 : -1)) {
            let loot = lootHistory.DKP.filter(a => a.user == user.username);
            if (loot.length == 0) continue;
            let newDescription = `${user.username.split('(')[0].trim()} (${loot.reduce((a, b) => a + b.points_spent, 0).toFixed(1)} DKP): ${loot.filter((a, i) => loot.slice(0, i).find(b => b.item == a.item) == null).map(a => {
              let all = loot.filter(b => b.item == a.item);
              return `${a.item}${all.length == 1 ? '' : ` (x${all.length})`} (${all.reduce((a, b) => a + b.points_spent, 0).toFixed(1)} DKP)`;
            }).join(', ')}`;
            if (`${embeds.DKP[embeds.DKP.length - 1].data.description}\n${newDescription}`.length > 4092) {
                embeds.DKP[embeds.DKP.length - 1].data.description += '\n```'
                embeds.DKP.push(new EmbedBuilder().setDescription('```\n'));
            } else embeds.DKP[embeds.DKP.length - 1].data.description += '\n';
            embeds.DKP[embeds.DKP.length - 1].data.description += `\n${newDescription}`;
        }
        embeds.DKP[embeds.DKP.length - 1].data.description += '\n```'
        let messages = Array.from((await lootHistoryChannels.DKP.messages.fetch({ limit: 100, cache: false })).values()).filter(a => a.author.id == client.user.id).reverse();
        for (let message of messages.slice(embeds.DKP.length)) await message.delete();
        embeds.DKP.forEach(async (a, i) => {
            if (messages[i]) await messages[i].edit({ content: '', embeds: [a], components: [] })
            else await lootHistoryChannels.DKP.send({ embeds: [a] });
        })

        for (let user of userList.sort((a, b) => a.username > b.username ? 1 : -1)) {
            let loot = lootHistory.PPP.filter(a => a.user == user.username);
            if (loot.length == 0) continue;
            let newDescription = `${user.username.split('(')[0].trim()} (${loot.reduce((a, b) => a + b.points_spent, 0).toFixed(1)} PPP): ${loot.filter((a, i) => loot.slice(0, i).find(b => b.item == a.item) == null).map(a => {
              let all = loot.filter(b => b.item == a.item);
              return `${a.item}${all.length == 1 ? '' : ` (x${all.length})`} (${all.reduce((a, b) => a + b.points_spent, 0).toFixed(1)} PPP)`;
            }).join(', ')}`;
            if (`${embeds.PPP[embeds.PPP.length - 1].data.description}\n${newDescription}`.length > 4092) {
                embeds.PPP[embeds.PPP.length - 1].data.description += '\n```'
                embeds.PPP.push(new EmbedBuilder().setDescription('```\n'));
            } else embeds.PPP[embeds.PPP.length - 1].data.description += '\n';
            embeds.PPP[embeds.PPP.length - 1].data.description += `\n${newDescription}`;
        }
        embeds.PPP[embeds.PPP.length - 1].data.description += '\n```'
        messages = Array.from((await lootHistoryChannels.PPP.messages.fetch({ limit: 100, cache: false })).values()).filter(a => a.author.id == client.user.id).reverse();
        for (let message of messages.slice(embeds.PPP.length)) await message.delete();
        embeds.PPP.forEach(async (a, i) => {
            if (messages[i]) await messages[i].edit({ content: '', embeds: [a], components: [] })
            else await lootHistoryChannels.PPP.send({ embeds: [a] });
        })

        setTimeout(updateLootHistoryTable, 60 * 1000);
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
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent
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
            if (error) console.log('Error inserting claim rate:', error, { team, row: claims[team] });
        }
    }
    updateClaimRates();

    async function updateTagRates() {
        if (await updateUsers()) return console.log('Error updating user list, aborting tag rate update');

        let { data, error } = await supabase.from(config.supabase.tables.tags).select('player_id, monster_name');
        if (error) return console.log('Error fetching tags:', error);
        let tags = data.reduce((a, b) => {
            if (!config.supabase.trackedRates.includes(b.monster_name)) return;
            b.monster_name;
            if (a[b.player_id] == null) a[b.player_id] = {};
            if (a[b.player_id][b.monster_name] == null) a[b.player_id][b.monster_name] = 0;
            a[b.player_id][b.monster_name]++;
            return a;
        }, {});

        for (let user in tags) {
            for (let monster in tags[user]) {
                tags[user][`${monster.toLowerCase().replaceAll(' ', '')}_tag_rate`] = tags[user][monster] / data.filter(a => a.monster_name == monster).length;
                delete tags[user][monster];
            }
            ({ error } = await supabase.from(config.supabase.tables.users).update(tags[user]).eq('id', user));
            if (error) console.log('Error updating tag rates:', error);
        }
    }
    updateTagRates();

    async function updateFreeze() {
        for (let user of userList || []) {
            if (user.frozen) {
                let { data: signups, error } = await supabase.from(config.supabase.tables.signups).select('event_id (monster_name), date').eq('player_id', user.id);
                if (error) {
                    console.log(`Error fetching ${user.username}'${user.username.endsWith('s') ? '' : 's'}: ${error.message}`);
                    continue;
                }
                rules = signups.filter(a => new Date(a.date).getTime() > new Date(user.frozen_date).getTime()).map(a => campRules.find(b => b.monster_name == a.event_id.monster_name));
                if (rules.includes(null)) {
                    console.log(`[Update Freeze]: Error: cannot find camp rule for monster "${signups[rules.indexOf(null)].event_id.monster_name}"`);
                    continue;
                }
                if (rules.length >= 7) {
                    user.frozen = false;
                    let { error } = await supabase.from(config.supabase.tables.users).update({ frozen: false }).eq('id', user.id);
                    if (error) console.log(`Error unfreezing ${user.username}: ${error.message}`);
                }
            } else {
                if (Date.now() - new Date(user.last_camped).getTime() > 14 * 24 * 60 * 60 * 1000) {
                    user.frozen = true;
                    user.frozen_date = new Date().toISOString();
                    let { error } = await supabase.from(config.supabase.tables.users).update({ frozen: true, frozen_date: new Date().toISOString() }).eq('id', user.id);
                    if (error) console.log(`Error freezing ${user.username}: ${error.message}`);
                }
            }
        }

        setTimeout(updateFreeze, 60000);
    }

    function calculateCampPoints(monster, windows, totalWindows) {
        let campRule = campRules.find(a => a.monster_name == monster);
        if (campRule == null) console.log(`Error: couldn't fetch camp point rule for ${monster}`);
        else {
            let points = 0;
            if (campRule.bonus_windows) points += Math.min(Math.floor(windows / campRule.bonus_windows) * campRule.bonus_points, campRule.max_bonus);
            let diff = totalWindows - windows;
            console.log(windows, diff, campRule)
            if (windows > 0) points += campRule.camp_points[campRule.camp_points.length - 1 - diff] || 0;
            return points;
        }
    }

    function calculateBonusPoints(signup, type) {
        let bonusRules = pointRules.filter(a => a.monster_type == type);
        let dkp = 0;
        let ppp = 0;
        if (signup.tagged) {
            let rule = bonusRules.find(a => a.point_code == 't');
            if (rule == null) return console.log(`[Calculate Bonus Points]: Error: Couldn't find tag point rule for monster type ${type}`);
            dkp += rule.dkp_value;
            ppp += rule.ppp_value;
        }
        if (signup.killed) {
            let rule = bonusRules.find(a => a.point_code == 'k');
            if (rule == null) return console.log(`[Calculate Bonus Points]: Error: Couldn't find kill point rule for monster type ${type}`);
            dkp += rule.dkp_value;
            ppp += rule.ppp_value;

            if (signup.rage) {
                let rule = bonusRules.find(a => a.point_code == 'r');
                if (rule == null) return console.log(`[Calculate Bonus Points]: Error: Couldn't find rage point rule for monster type ${type}`);
                dkp += rule.dkp_value;
                ppp += rule.ppp_value;
            }
        }
        
        return dkp || ppp;
    }

    class Monster {
        constructor(name, timestamp, day, event, threads, rage, thread, message, windows, killer, todGrabber) {
            this.group = config.roster.monsterGroups.find(a => a.includes(name));
            this.name = this.group == null ? name : this.group.join('/');
            if (config.roster.placeholderMonsters.includes(this.name)) {
                this.alliances = 2;
                this.placeholders = {};
            }
            this.timestamp = timestamp;
            this.day = day;
            this.event = event;
            this.rage = rage;
            this.signups = Array(this.alliances).fill().map(() => Array(this.parties).fill().map(() => Array(this.slots).fill()));
            this.leaders = Array(this.alliances).fill().map(() => Array(this.parties).fill());
            this.removedLeader = Array(this.alliances).fill().map(() => Array(this.parties).fill());
            
            this.thread = thread;
            this.message = message;
            this.windows = windows;
            this.killer = killer;
            this.todGrabber = todGrabber;
            this.todGrabs = [];

            this.clears = 0;
            this.verifiedClears = [];

            this.data = monsterList.find(a => a.monster_name == this.name.split('/')[this.day < 4 ? 0 : 1]);
            if (this.data == null) console.log(`Error: could not find data for monster "${this.name}"`);
            else if (thread == null) this.thread = threads[this.data.channel_type].find(a => a.name == this.name);
        }
        active = true;
        alliances = config.roster.alliances;
        parties = config.roster.parties;
        slots = config.roster.slots;
        calculatePoints(playerId) {
            return calculateCampPoints(this.data.monster_name, this.data.signups.filter(a => a.player_id.id == playerId).reduce((a, b) => a + b.windows || 0, 0), this.windows);
        }
        getPointType(camp) {
            if (camp) {
                let rule = campRules.find(a => a.monster_name == this.data.monster_name);
                if (rule == null) console.log(`Error: couldn't fetch camp point rule for ${this.data.monster_name}`);
                else return rule.type;
            } else {
                let type = this.data.monster_type;
                if (type == 'NQ' && this.day >= 4) type = 'HQ';
                let rule = pointRules.find(a => a.monster_type == this.data.monster_type);
                if (rule == null) console.log(`Error: couldn't fetch bonus point rule for ${this.data.monster_type}`);
                else return rule.dkp_value ? 'DKP' : 'PPP';
            }
        }
        calculateBonusPoints(signup) {
            let type = this.data.monster_type;
            if (type == 'NQ' && this.day >= 4) type = 'HQ'; 
            return calculateBonusPoints(signup, type);
        }
        createEmbeds() {
            if (this.active) {
                let signups = this.signups.flat(2).filter((a, i, arr) => a != null && arr.slice(0, i).find(b => b != null && a.user.id == b.user.id) == null).length;
                let embed = new EmbedBuilder()
                    .setTitle(`🐉 ${this.name}${this.day == null ? '' : ` (Day ${this.day})`}${this.rage ? ' (Rage)' : ''}${this.paused ? ' (Paused)' : ''}`)
                    .setThumbnail(`https://mrqccdyyotqulqmagkhm.supabase.co/storage/v1/object/public/${config.supabase.buckets.images}/${this.data.monster_name.split('_')[0].replaceAll(' ', '')}.png`)
                    .setDescription(`**${signups} member${signups == 1 ? '' : 's'} signed up**\n🕒 Starts at <t:${this.timestamp}:D> <t:${this.timestamp}:T> (<t:${this.timestamp}:R>)${this.lastCleared == null ? '' : `\nLast Cleared: <t:${Math.floor(this.lastCleared.getTime() / 1000)}:R>`}${this.todGrabber == null ? '' : `\n**TOD Grabber: ${this.todGrabber.username}**`}${this.todGrabs.length == 0 ? '' : '\n\n**TOD Grabbers**'}${this.todGrabs.map(a => `\n**${a.player_id.username}: ${a.todgrab}**`).join('')}`)
                    .addFields(
                        ...Array(this.alliances).fill().map((a, i) => [
                            Array(this.parties).fill().map((b, j) => {
                                let field = {
                                    name: `${j == 0 ? `🛡️ Alliance ${i + 1} - ` : ''}Party ${j + 1}`,
                                    value: `(0/0)`,
                                    inline: true
                                };
                                for (let k = 0; k < this.slots; k++) {
                                    let template = templateList.find(a => a.monster_name == this.data.monster_name && a.alliance_number == i + 1 && a.party_number == j + 1 && a.party_slot_number == k + 1);
                                    if (template == null) {
                                        console.log(`Error: Cannot find template for ${this.name}, Alliance ${i + 1}, Party ${j + 1}, Slot ${k + 1}`);
                                        template = { allowed_job_ids: [] };
                                    }

                                    let role;
                                    let username = '-';
                                    if (this.signups[i][j][k] != null) {
                                        let job = jobList.find(a => a.job_id == this.signups[i][j][k].job);
                                        if (job == null) console.log(`Error: can't find job id: ${this.signups[i][j][k].job}`);
                                        else {
                                            role = `\`${job.color}${job.job_abbreviation}\``;
                                            username = `${this.leaders[i][j]?.id == this.signups[i][j][k].user.id ? '👑 ' : ''}${this.signups[i][j][k].user.username}`;
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
                            value: Object.keys(this.placeholders).length == 0 ? '​' : `\`\`\`\n${Object.entries(this.placeholders).sort((a, b) => a > b ? 1 : -1).map(a => `${a[0]}: ${a[1]}${' '.repeat(longest - `${a[0]}: ${a[1]}`.length)} | ${(Math.floor(a[1] / 4) * 0.2).toFixed(1)} PPP`).join('\n')}\n\`\`\``
                        }
                    )
                };
                return [embed];
            } else {
                if (this.data.signups.length == 0) {
                    return [
                        new EmbedBuilder()
                            .setTitle(`🐉 ${this.name} (Day ${this.day})${this.rage ? ' (Rage)' : ''}`)
                            .setThumbnail(`https://mrqccdyyotqulqmagkhm.supabase.co/storage/v1/object/public/${config.supabase.buckets.images}/${this.data.monster_name.split('_')[0].replaceAll(' ', '')}.png`)
                            .setDescription('No participants recorded.')
                    ]
                } else {
                    return [
                        this.data.signups.filter(a => a.active),
                        this.data.signups.filter(a => !a.active && this.data.signups.find(b => b.active && b.player_id.id == a.player_id.id) == null)
                    ].filter(a => a.length > 0).map((a, i) => {
                        let embed = new EmbedBuilder()
                            .setThumbnail(`https://mrqccdyyotqulqmagkhm.supabase.co/storage/v1/object/public/${config.supabase.buckets.images}/${this.data.monster_name.split('_')[0].replaceAll(' ', '')}.png`)
                        if (i == 0) embed.setTitle(`🐉 ${this.name} (Day ${this.day})${this.rage ? ' (Rage)' : ''}`);
                        embed.setDescription(`${i == 0 ? '🕒 Closed\n\n**Current Window**\n' : '**Previous Windows**\n'}\`\`\`\n${
                            a.filter((b, i, arr) => arr.slice(0, i).find(c => c.player_id.id == b.player_id.id) == null).map(b => {
                                let userSignups = this.data.signups.filter(c => c != null && c.player_id.id == b.player_id.id); 
                                let totalWindows = this.name == 'Tiamat' ? userSignups.length : userSignups.reduce((a, b) => a + b?.windows || 0, 0);
                                return `${b.active && b.windows == null && b.tagged == null && b.killed == null ? '✖' : '✓'} ${b.player_id.username}${this.name != 'Tiamat' && userSignups.length > 1 ? ` x${userSignups.length}` : ''}${this.placeholders == null ? ((totalWindows == null || this.data.max_windows == 1) ? '' : ` - ${totalWindows}${this.windows == null ? '' : `/${this.windows}`} windows`) : ` - ${b.placeholders} PH`}${b.tagged ? ' - T' : ''}${b.killed ? ' - K' : ''}${b.rage ? ' - R' : ''} Camp: ${this.placeholders != null ? `${(Math.floor(b.placeholders / 4) * 0.2).toFixed(1)} PPP` : `${this.calculatePoints(b.player_id.id)} ${this.getPointType(true)}`} Bonus: ${this.calculateBonusPoints(b)} ${this.getPointType(false)}`;
                            }).join('\n\n')
                        }\n\`\`\``);
                        if (this.verified) embed.setFooter({ text: '✓ Verified' });

                        return embed;
                    }).filter(a => a != null);
                }
            }
        }
        createButtons() {
            let unverifiedClears = new Array(this.clears).fill().map((a, i) => i).filter(a => !this.verifiedClears.includes(a));
            if (this.verified) {
                return this.data.signups.length == 0 ? [] : [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('📷 Upload Tag Screenshot')
                                .setStyle(ButtonStyle.Primary)
                                .setCustomId(`screenshot-monster-${this.event}`),
                        ),
                    unverifiedClears.length == 0 ? null : new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId(`membersscreenshot-window-${this.event}`)
                                .setPlaceholder('📷 Upload Tiamat Attendance')
                                .addOptions(
                                    unverifiedClears.map(a => 
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel(`Window ${a + 1}`)
                                            .setValue(`${a}`)
                                    )
                                )
                        )
                ].filter(a => a != null);
            }
            if (this.paused) return [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`pause-unpause-${this.name}`)
                            .setStyle(ButtonStyle.Success)
                            .setLabel('▶ Unpase'),
                        new ButtonBuilder()
                            .setCustomId(`populate-monster-${this.name}`)
                            .setLabel('💰 Populate')
                            .setStyle(ButtonStyle.Success)
                    ),
                unverifiedClears.length == 0 ? null : new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId(`membersscreenshot-window-${this.event}`)
                            .setPlaceholder('📷 Upload Tiamat Attendance')
                            .addOptions(
                                unverifiedClears.map(a => 
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel(`Window ${a + 1}`)
                                        .setValue(`${a}`)
                                )
                            )
                    )
            ].filter(a => a != null);
            if (this.active) {
                return [
                    new ActionRowBuilder()
                        .addComponents(
                            ...[
                                new ButtonBuilder()
                                    .setCustomId(`quickjoin-job-${this.name}`)
                                    .setLabel('≫ Quick Join')
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId(`signup-select-${this.name}`)
                                    .setLabel('📝 Sign Up')
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId(`editroster-monster-${this.name}`)
                                    .setLabel('🛡️ Edit Roster')
                                    .setStyle(ButtonStyle.Primary),
                                this.signups.find((a, i) => a.find((b, j) => this.leaders[i][j] == null)) == null ? null : new ButtonBuilder()
                                    .setCustomId(`leader-monster-${this.name}`)
                                    .setLabel('👑 Leader')
                                    .setStyle(ButtonStyle.Secondary),
                                this.data.channel_type == 'PPP' ? null : new ButtonBuilder()
                                    .setCustomId(`todgrab-select-${this.name}`)
                                    .setLabel('Tod Grab')
                                    .setStyle(ButtonStyle.Secondary)
                            ].filter(a => a != null)
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            ...[
                                new ButtonBuilder()
                                    .setCustomId(`editsignup-monster-${this.event}`)
                                    .setLabel('✏️ Edit Signup')
                                    .setStyle(ButtonStyle.Secondary),
                                new ButtonBuilder()
                                    .setCustomId(`leave-monster-${this.name}`)
                                    .setLabel('✖ Leave')
                                    .setStyle(ButtonStyle.Danger),
                                this.name == 'Tiamat' ? new ButtonBuilder()
                                    .setCustomId(`clear-monster-${this.name}`)
                                    .setLabel('🗑️ Clear')
                                    .setStyle(ButtonStyle.Secondary) : null
                            ].filter(a => a != null)
                        ),
                    this.placeholders == null ? null : new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`placeholder-increment-${this.name}`)
                                .setLabel('+1 Placeholder')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId(`placeholder-enter-${this.name}`)
                                .setLabel('Enter Placeholders')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId(`placeholder-remove-${this.name}`)
                                .setLabel('Remove Placeholders')
                                .setStyle(ButtonStyle.Secondary)
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`pause-pause-${this.name}`)
                                .setStyle(ButtonStyle.Danger)
                                .setLabel('⏸ Pause'),
                            new ButtonBuilder()
                                .setCustomId(`populate-monster-${this.name}`)
                                .setLabel('💰 Populate')
                                .setStyle(ButtonStyle.Success)
                        ),
                    unverifiedClears.length == 0 ? null : new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId(`membersscreenshot-window-${this.event}`)
                                .setPlaceholder('📷 Upload Tiamat Attendance')
                                .addOptions(
                                    unverifiedClears.map(a => 
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel(`Window ${a + 1}`)
                                            .setValue(`${a}`)
                                    )
                                )
                        )
                ].filter(a => a != null);
            }
            if (this.data.signups.length > 0) {
                let signups = this.data.signups.filter((a, i) => a.active || this.data.signups.find((b, j) => b.player_id.id == a.player_id.id && (b.active || j > i)) == null);
                return [
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('Attendance')
                                .setStyle(ButtonStyle.Primary)
                                .setCustomId(`attendance-monster-${this.event}`),
                            new ButtonBuilder()
                                .setLabel('📷 Upload Tag Screenshot')
                                .setStyle(ButtonStyle.Primary)
                                .setCustomId(`screenshot-monster-${this.event}`),
                            new ButtonBuilder()
                                    .setCustomId(`editsignup-monster-${this.event}`)
                                    .setLabel('✏️ Edit Signup')
                                    .setStyle(ButtonStyle.Secondary)
                        ),
                    ...new Array(Math.ceil(signups.length / 25)).fill().map((a, i) =>
                        new ActionRowBuilder()
                            .addComponents(
                                new StringSelectMenuBuilder()
                                    .setPlaceholder('🛡️ Edit User')
                                    .setCustomId(`editsignup-signup-${i}-${this.event}`)
                                    .addOptions(
                                        ...Array(Math.min(25, signups.length - i * 25)).fill().map((a, j) =>
                                            new StringSelectMenuOptionBuilder()
                                                .setLabel(`${signups[i * 25 + j].player_id.username}`)
                                                .setValue(`${signups[i * 25 + j].signup_id}`)
                                        )
                                    )
                            )
                    ),
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setLabel('🛡️ Verify Raid')
                                .setStyle(ButtonStyle.Success)
                                .setCustomId(`resolve-monster-${this.event}`)
                        ),
                    unverifiedClears.length == 0 ? null : new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId(`membersscreenshot-window-${this.event}`)
                                .setPlaceholder('📷 Upload Tiamat Attendance')
                                .addOptions(
                                    unverifiedClears.map(a => 
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel(`Window ${a + 1}`)
                                            .setValue(`${a}`)
                                    )
                                )
                        )
                ].filter(a => a != null)
            }
            return [
                unverifiedClears.length == 0 ? null : new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId(`membersscreenshot-window-${this.event}`)
                            .setPlaceholder('📷 Upload Tiamat Attendance')
                            .addOptions(
                                unverifiedClears.map(a => 
                                    new StringSelectMenuOptionBuilder()
                                        .setLabel(`Window ${a + 1}`)
                                        .setValue(`${a}`)
                                )
                            )
                    )
            ].filter(a => a != null);
        }
        async updateMessage() {
            return await this.message.edit({ embeds: this.createEmbeds(), components: this.createButtons() });
        }
        async updateLeaders() {
            for (let i = 0; i < this.signups.length; i++) {
                for (let j = 0; j < this.signups[i].length; j++) {
                    if (this.leaders[i][j] != null && !this.signups[i][j].filter(a => a != null).find(a => a.user.id == this.leaders[i][j].id)) this.leaders[i][j] = null;
                    if (this.signups[i][j].filter(a => a == null).length == 0 && this.leaders[i][j] == null) {
                        let candidates = this.signups[i][j].filter(a => a != this.removedLeader[i][j] && jobList.find(b => b.job_id == a.job)?.role_type != 'Tank');
                        if (candidates.length == 0) continue;
                        this.leaders[i][j] = candidates[Math.floor(Math.random() * candidates.length)].user;
                        await this.updateMessage();
                        let embed = new EmbedBuilder()
                            .setTitle('Leader Chosen')
                            .setDescription(`<@${this.leaders[i][j].id}> is now leader of alliance ${i + 1} party ${j + 1}.`)
                        await this.message.reply({ embeds: [embed] });
                    }
                }
            }

            let attendance = (this.data.signups ? this.data.signups.map(a => a.signup_id) : this.signups.flat().flat().filter(a => a != null).map(a => a.signupId)).filter((a, i, arr) => arr.slice(0, i).find(b => a == b) == null);
            let { error } = supabase.from(config.supabase.tables.events).update({ attendance }).eq('event_id', this.event);
            if (error) console.log(`Error updating attendance for event ${this.event}: ${error.message}`);
        }
        createVerificationEmbeds() {
            let unverified = this.data.signups.filter(a => a.active && a.verified == null && a.todgrab == null);
            if (unverified.length == 0) {
                return [
                    new EmbedBuilder()
                        .setTitle(`${this.data.monster_name.split('_')[0]} Verification Complete`)
                        .setDescription(`<t:${this.timestamp}:d>`)
                        .setThumbnail(`https://mrqccdyyotqulqmagkhm.supabase.co/storage/v1/object/public/${config.supabase.buckets.images}/${this.data.monster_name.split('_')[0].replaceAll(' ', '')}.png`)
                        .setFooter({ text: `Total ${this.data.signups.filter(a => a.active).length} • Reviewed ${this.data.signups.filter(a => a.active && a.verified != null).length}` })
                ]
            } else {
                return new Array(Math.ceil(unverified.length / 25)).fill().map((a, i) => 
                    new EmbedBuilder()
                        .setTitle(`${this.data.monster_name.split('_')[0]} Tag Verification`)
                        .setDescription(`<t:${this.timestamp}:d>`)
                        .setThumbnail(`https://mrqccdyyotqulqmagkhm.supabase.co/storage/v1/object/public/${config.supabase.buckets.images}/${this.data.monster_name.split('_')[0].replaceAll(' ', '')}.png`)
                        .addFields(
                            ...new Array(Math.min(unverified.slice(i * 25).length, 25)).fill().map((b, j) =>
                                ({
                                    name: `${unverified[i * 25 + j].player_id.username} (${this.calculateBonusPoints(unverified[i * 25 + j])} ${this.getPointType(false)})`,
                                    value: unverified[i * 25 + j].screenshot == null ? 'No screenshot uploaded' : `[Screenshot](https://mrqccdyyotqulqmagkhm.supabase.co/storage/v1/object/public/${config.supabase.buckets.screenshots}/${unverified[i * 25 + j].screenshot})`
                                })
                            )
                        )
                        .setFooter({ text: `Total ${this.data.signups.filter(a => a.active).length} • Reviewed ${this.data.signups.filter(a => a.active && a.verified != null).length}` })
                )
            }
        }
        createVerificationComponents() {
            let unverified = this.data.signups.filter(a => a.active == true && a.verified == null);
            if (unverified.length == 0) return [];
            else {
                return [
                    ...new Array(Math.ceil(unverified.length / 25)).fill().map((a, i) =>
                            new ActionRowBuilder()
                                .addComponents(
                                    new StringSelectMenuBuilder()
                                        .setPlaceholder('🛡️ Verify User')
                                        .setCustomId(`verify-signup-${this.event}-${i}`)
                                        .addOptions(
                                            ...Array(Math.min(25, unverified.length - i * 25)).fill().map((a, j) => 
                                                new StringSelectMenuOptionBuilder()
                                                    .setLabel(`${unverified[i * 25 + j].player_id.username}`)
                                                    .setValue(`${unverified[i * 25 + j].signup_id}`)
                                            )
                                        )
                                )
                        ),
                    new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`verify-view-${this.event}`)
                                .setLabel('Preview')
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`verify-verify-${this.event}`)
                                .setLabel('Approve')
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setCustomId(`verify-decline-${this.event}`)
                                .setLabel('Decline')
                                .setStyle(ButtonStyle.Danger)
                        )
                ]
            }
        }
        async updatePanel() {
            if (this.panel == null) {
                let channelName = (this.group ? this.group.map(a => a).join('—') : this.name).replaceAll(' ', '-').toLowerCase();
                let channels = [...(await screenshotPanelCategory.guild.channels.fetch(null, { force: true })).values()].filter(a => a.parentId == screenshotPanelCategory.id);
                let channel = channels.find(a => a.name == channelName);
                if (channel == null) {
                    try {
                        channel = await screenshotPanelCategory.children.create({
                            name: channelName,
                            type: ChannelType.GuildText
                        });
                    } catch (err) {
                        return console.log('Error creating screenshot panel channel:', err);
                    }
                }
                try {
                    this.panel = await channel.send({ embeds: this.createVerificationEmbeds(), components: this.createVerificationComponents() });
                } catch (err) {
                    return console.log('Error sending screenshot verification panel message:', err);
                }
            }
            return await this.panel.edit({ embeds: this.createVerificationEmbeds(), components: this.createVerificationComponents() });
        }
        async close() {
            let data;
            let error;
            if (config.supabase.trackedRates.includes(this.name)) {
                ({ error } = await supabase.from(config.supabase.tables.claims).insert({ linkshell_name: this.killer, monster_name: this.name }));
                if (error) return { error };

                ({ error } = await supabase.from(config.supabase.tables.deaths).insert({ monster_name: this.name }));
                if (error) return { error };
            }
            
            if (this.todGrabber != null) {
                ({ error } = await supabase.from(config.supabase.tables.signups).insert({ event_id: this.event, player_id: this.todGrabber.id, active: true, todgrab: true }));
                if (error) return { error };
            }
            
            ({ data, error } = await supabase.from(config.supabase.tables.signups).select('*, player_id (id, username)').eq('event_id', this.event));
            if (error) return { error };
            this.data.signups = data;


            ({ error } = await supabase.from(config.supabase.tables.events).update({ active: false, verified: this.data.signups.length == 0, close_date: new Date() }).eq('event_id', this.event));
            if (error) return { error };
            this.active = false;
            this.verified = this.data.signups.length == 0;
            this.closeDate = new Date();

            await this.updateMessage();
            delete monsters[this.name];
            if (this.group) delete monsters[this.group.join('/')];
            if (this.verified) delete archive[this.event];

            await this.updatePanel();

            for (let signup of this.data.signups.filter(a => a.active)) {
                let user = signup.player_id;
                if (this.name == 'Tiamat') signup.windows = this.data.signups.filter(a => a.player_id.id == user.id).length;
            }

            await updateClaimRates();

            if (this.data.signups.length == 0) setTimeout(this.message.delete, 60 * 60 * 1000);
        }
    }

    let monsters = {};
    let archive = {};
    async function scheduleMonster(message, events = []) {
        let monster = message.embeds[0].title;
        let group = config.roster.monsterGroups.find(a => a.includes(monster)) || [monster];
        let timestamp = parseInt(message.embeds[0].fields[0].value.split(':')[1]);
        let day = parseInt(message.embeds[0].fields[1].value);
        let delay = timestamp - (Date.now() / 1000);
        // if (delay < 0) return;
        // if (delay > config.roster.postDelay) await new Promise(res => setTimeout(res, (delay - config.roster.postDelay) * 1000));

        let dupeEvents = Object.values(archive).filter(a => group.includes(a.data.monster_name));
        for (let event of dupeEvents) {
            if (event.active && event.signups.flat(2).filter(a => a != null).length > 0) {
                await event.message.reply(`<@&${config.discord.usersRole}> A new raid is ready, please close the previous roster`);
                await new Promise(res => {
                    let interval = setInterval(() => {
                        if (!event.active) {
                            clearInterval(interval);
                            res();
                        }
                    })
                })
            }
            await event.message.delete();
            delete archive[event.event];
        }

        let threads = {
            DKP: Array.from((await rosterChannels.DKP.threads.fetchActive(false)).threads.values()).concat(Array.from((await rosterChannels.DKP.threads.fetchArchived(false)).threads.values())),
            PPP: Array.from((await rosterChannels.PPP.threads.fetchActive(false)).threads.values()).concat(Array.from((await rosterChannels.PPP.threads.fetchArchived(false)).threads.values()))
        }
        let event = events.find(a => group.includes(a.monster_name) && new Date(a.start_time).getTime() / 1000 == timestamp);
        if (event == null) {
            let { data, error } = await supabase.from(config.supabase.tables.events).insert({
                monster_name: monster,
                start_time: new Date(timestamp * 1000),
                day
            }).select('*').single();
            if (error) return console.log(`Error creating event for ${monster}:`, error.message);
            event = data;

            let newMonster = new Monster(monster, timestamp, day, event.event_id, threads);
            monster = newMonster.name;
            monsters[monster] = newMonster;
        } else {
            if (!event.active) return;
            let thread;
            let message;
            if (event.channel != null) {
                try {
                    thread = await client.channels.fetch(event.channel);
                    message = await thread.messages.fetch(event.message);
                } catch (err) {
                    if (!err.message.includes('Unknown Message')) console.log('Error fetching previous monster message:', err);
                }
            }

            if (message == null) return;
            let todGrabber = event.todgrab == null ? null : await getUser(event.todgrab);
            if (event.todgrab != null && todGrabber == null) console.log(`[Schedule Monster]: Error: could not fetch user with id ${event.todGrabber}`);
            let newMonster = new Monster(monster, timestamp, day, event.event_id, threads, event.rage, thread, message, event.windows, event.killed_by, todGrabber);
            monster = newMonster.name;
            monsters[monster] = newMonster;
            let { data, error } = await supabase.from(config.supabase.tables.signups).select('*, player_id (id, username)').eq('event_id', event.event_id).eq('active', true);
            if (error) {
                console.log('Error fetching signups:', error.message);
                data = [];
            }

            let todGrabs = [];
            for (let signup of data) {
                if (signup.todgrab) {
                    todGrabs.push(signup);
                    continue;
                }
                if (monsters[monster].placeholders && signup.placeholders) monsters[monster].placeholders[signup.player_id.username] = signup.placeholders;

                let template = templateList.find(a => a.slot_template_id == signup.slot_template_id);
                if (template == null) {
                    console.log(`Error: couldn't find template with id "${signup.slot_template_id}"`)
                    continue;
                }

                let user = await getUser(signup.player_id.id);
                if (user.error) {
                    console.log(`Error fetching user with id "${signup.player_id.id}": ${user.error}`);
                    continue;
                }

                let job = jobList.find(a => a.job_id == signup.assigned_job_id)?.job_id;
                if (job == null) {
                    console.log(`Error: couldn't find job with id "${signup.assigned_job_id}"`)
                    continue;
                }
                monsters[monster].signups[template.alliance_number - 1][template.party_number - 1][template.party_slot_number - 1] = {
                    user,
                    job,
                    signupId: signup.signup_id
                };
                if (signup.leader) monsters[monster].leaders[template.alliance_number - 1][template.party_number - 1] = user;
            }
            monsters[monster].todGrabs = todGrabs;
        }

        if (monsters[monster].message == null) {
            if (monsters[monster].thread == null) {
                monsters[monster].thread = await rosterChannels[monsters[monster].data.channel_type].threads.create({
                    name: monsters[monster].group ? monsters[monster].group.map(a => a).join('/') : monsters[monster].name,
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
        } else await monsters[monster].updateMessage();
        archive[monsters[monster].event] = monsters[monster];
    }

    let guild;
    let monstersChannel;
    let rosterChannels;
    let ocrCategory;
    let logChannel;
    let screenshotPanelCategory;
    let memberScreenshotsChannel;
    let rewardHistoryChannel;
    let graphChannels;
    let userAttendanceChannel;
    let lootHistoryChannels;
    client.once(Events.ClientReady, async () => {
        console.log(`[Bot]: ${client.user.tag}`);
        console.log(`[Servers]: ${client.guilds.cache.size}`);
        guild = await client.guilds.fetch(config.discord.server);
        monstersChannel = await client.channels.fetch(config.discord.monstersChannel);
        rosterChannels = {
            DKP: await client.channels.fetch(config.discord.rosterChannel.DKP),
            PPP: await client.channels.fetch(config.discord.rosterChannel.PPP)
        }
        ocrCategory = await client.channels.fetch(config.discord.ocrCategory);
        logChannel = await client.channels.fetch(config.discord.logChannel);
        screenshotPanelCategory = await client.channels.fetch(config.discord.screenshotPanelCategory);
        memberScreenshotsChannel = await client.channels.fetch(config.discord.memberScreenshots);
        rewardHistoryChannel = await client.channels.fetch(config.discord.rewardHistoryChannel);
        graphChannels = {
            DKP: await client.channels.fetch(config.discord.graphChannel.DKP),
            PPP: await client.channels.fetch(config.discord.graphChannel.PPP)
        }
        userAttendanceChannel = await client.channels.fetch(config.discord.userAttendanceChannel);
        lootHistoryChannels = {
            DKP: await client.channels.fetch(config.discord.lootHistoryChannel.DKP),
            PPP: await client.channels.fetch(config.discord.lootHistoryChannel.PPP)
        }

        updateGraphs();
        updateUserTable();
        updateLootHistoryTable();

        let messages = Array.from((await monstersChannel.messages.fetch({ limit: 100, cache: false })).values()).filter(a => a.embeds.length > 0).reverse();

        let { data: events, error } = await supabase.from(config.supabase.tables.events).select('*');
        if (error) {
            console.log('Error fetching events:', error.message);
            events = [];
        }

        for (let event of events.filter(a => a.verified == null)) {
            if (event.channel == null) continue;
            let thread;
            let message;
            try {
                thread = await client.channels.fetch(event.channel);
                message = await thread.messages.fetch(event.message);
            } catch (err) {
                console.log('Error fetching previous monster message:', err);
                continue;
            }
            let todGrabber = event.todgrab == null ? null : await getUser(event.todgrab);
            if (event.todgrab != null && todGrabber == null) console.log(`[Schedule Monster]: Error: could not fetch user with id ${event.todGrabber}`);
            archive[event.event_id] = new Monster(event.monster_name, event.start_time, event.day, event.event_id, null, event.rage, thread, message, event.windows, event.killed_by, todGrabber);
            archive[event.event_id].name = event.monster_name;
            archive[event.event_id].active = false;
            if (event.close_date) archive[event.event_id].closeDate = new Date(event.close_date);
            
            ({ data, error } = await supabase.from(config.supabase.tables.signups).select('*, player_id (id, username)').eq('event_id', event.event_id));
            if (error) {
                console.log('Error fetching signups:', error.message);
                continue;
            }
            archive[event.event_id].data.signups = data;
            archive[event.event_id].todGrabs = data.filter(a => a.todgrab != null);
            await archive[event.event_id].updateMessage();
        }
        console.log('Handled closed rosters');

        await Promise.all(messages.map(a => scheduleMonster(a, events)));
        console.log('Handled historical embeds');
    });

    async function getUser(id) {
        let { data: user, error } = await supabase.from(config.supabase.tables.users).select('id::text, username, dkp, ppp, frozen').eq('id', id).limit(1);
        return error ? { error } : user[0];
    }
    
    let messageCallbacks = [];

    client.on(Events.MessageCreate, async message => {
        if (message.channelId == config.discord.monstersChannel && message.embeds.length > 0) scheduleMonster(message);
        messageCallbacks = messageCallbacks.filter(a => a != null);
        for (let callback of messageCallbacks) if (message.channelId == callback.channel) callback.callback(message);

        if (message.channel.parentId == config.discord.ocrCategory && message.content.toLowerCase() == 'findme') {
            let reference = await message.fetchReference();
            if (reference.attachments.size == 0) {
                let embed = new EmbedBuilder()
                    .setTitle('Error')
                    .setColor('#ff0000')
                    .setDescription('No attachment was detected in the replied message')
                return await message.reply({ embeds: [embed] });
            }
            
            let { data, error } = await supabase.from(config.supabase.tables.signups).select('*, event_id (event_id, close_date)').eq('screenshot', reference.id).limit(1);
            if (error) console.log(`Error fetching signups for screenshot ${reference.id}: ${error.message}`);
            if (data.length == 0) {
                let embed = new EmbedBuilder()
                    .setTitle('Error')
                    .setColor('#ff0000')
                    .setDescription('No signup referencing this screenshot was found')
                return await message.reply({ embeds: [embed] });
            }
            let signup = data[0];
            if (Date.now() - new Date(signup.event_id.close_date).getTime() > 6 * 60 * 60 * 1000) {
                let embed = new EmbedBuilder()
                    .setTitle('Error')
                    .setColor('#ff0000')
                    .setDescription('This raid is no longer accepting attendance screenshots')
                return await message.reply({ embeds: [embed] });
            }

            ({ data, error } = await supabase.from(config.supabase.tables.signups).select('*').eq('event_id', signup.event_id.event_id).eq('player_id', message.author.id));
            if (error) console.log(`Error fetching ${message.author.username}'${message.author.username.endsWith('s') ? '' : 's'} signup for event ${signup.event_id.event_id}: ${error.message}`);
            if (data.length == 0) {
                let embed = new EmbedBuilder()
                    .setTitle('Error')
                    .setColor('#ff0000')
                    .setDescription(`You did not participate in this raid (event id: ${signup.event_id.event_id})`)
                return await message.reply({ embeds: [embed] });
            }
            let signupId = data.map(a => ({ signup_id: a.signup_id, date: new Date(a.date).getTime() })).sort((a, b) => b.date - a.date)[0].signup_id;

            ({ data, error } = await supabase.from(config.supabase.tables.signups).update({ screenshot: reference.id }).eq('signup_id', signupId));
            if (error) return console.log(`Error updating ${message.author.username}'${message.author.username.endsWith('s') ? '' : 's'} screenshot: ${error.message}`);
            
            let embed = new EmbedBuilder()
                .setTitle('Success')
                .setColor('#00ff00')
                .setDescription('Your attendance screenshot has been updated')
            await message.reply({ embeds: [embed] });
            await archive[signup.event_id.event_id].updatePanel();
        }
    })

    client.on(Events.InteractionCreate, async interaction => {
        let user = await getUser(interaction.user.id);
        let guildMember;
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
            guildMember = await interaction.guild.members.fetch(interaction.user.id);
            user.staff = false;
            for (const role of config.discord.staffRoles) if (guildMember.roles.cache.get(role)) user.staff = true;
        }

        let commandInput = {
            config,
            interaction,
            client,
            user,
            supabase,
            monsterList,
            userList,
            jobList,
            templateList,
            campRules,
            pointRules,
            groupList,
            tagList,
            lootHistory,
            eventList,
            signupList,
            monsters,
            archive,
            rosterChannels,
            ocrCategory,
            logChannel,
            memberScreenshotsChannel,
            rewardHistoryChannel,
            graphChannels,
            Monster,
            updateTagRates,
            updateGraphs,
            messageCallbacks,
            getUser,
            calculateCampPoints,
            calculateBonusPoints
        }

        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            
            if (guildMember == null) {
                let errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .addFields({ name: 'Error', value: 'You must be a member of the server to use this bot.' });
                await interaction.reply({ ephemeral: true, embeds: [errorEmbed], components: [] });
                return;
            }
            
            try {
                await command.execute(commandInput);
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
                await command.autocomplete(commandInput);
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
                if (command?.buttonHandler) command.buttonHandler(commandInput);
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
                if (command?.selectHandler) command.selectHandler(commandInput);
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
                if (command?.modalHandler) command.modalHandler(commandInput);
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
            await updateCampRules() ||
            await updatePointRules() ||
            await updateGroupList() ||
            await updateTagList() ||
            await updateLootHistory() ||
            await updateEventList() ||
            await updateSignupList()
        ) process.exit();
        updateFreeze();
        client.login(config.discord.token);
    })()
})();
