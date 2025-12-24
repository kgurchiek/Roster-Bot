const fs = require('fs');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { errorEmbed } = require('../commonFunctions.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('graph')
    .setDescription('Sends raid verification graphs')
    .addStringOption(option =>
        option.setName('backgroundcolor')
            .setDescription('the color of the background of the chart')
    )
    .addStringOption(option =>
        option.setName('fontcolor')
            .setDescription('the color of the text on the chart')
    )
    .addStringOption(option =>
        option.setName('linecolor')
            .setDescription('the color of the line on the chart')
    )
    .addStringOption(option =>
        option.setName('fillcolor')
            .setDescription('the color of the area beneath the line')
    ),
    async execute({ config, interaction, updateGraphs }) {
        await interaction.deferReply({ ephemeral: true });
        let args = {
            backgroundColor: interaction.options.getString('backgroundcolor'),
            fontColor: interaction.options.getString('fontcolor'),
            lineColor: interaction.options.getString('linecolor'),
            lineFillColor: interaction.options.getString('fillcolor')
        }
        for (let arg in args) if (args[arg]) config.graph[arg] = args[arg];

        let error = await new Promise(res => fs.writeFile('./config.json.temp', JSON.stringify(config, 0, 4), res));
        if (error) return await interaction.editReply({ embeds: [errorEmbed('Error saving new config', error.message)] });
        error = await new Promise(res => fs.copyFile('./config.json.temp', './config.json', res));
        if (error) return await interaction.editReply({ embeds: [errorEmbed('Error copying new config', error.message)] });

        let embed = new EmbedBuilder()
            .setDescription('Sending updated graphs...')
        await interaction.editReply({ embeds: [embed] });
        await updateGraphs();
        embed = new EmbedBuilder()
            .setTitle('Success')
            .setColor('#00ff00')
            .setDescription('New graphs have been sent')
        await interaction.editReply({ embeds: [embed ]});
    }
}