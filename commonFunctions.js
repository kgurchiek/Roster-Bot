const { EmbedBuilder } = require('discord.js');
module.exports = {
    errorEmbed: (name, error, message = 'Please try again later.') => {
        console.log(`[Error]: ${name} - ${error}`);
        return new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle(name)
            .setDescription(`\`${error}\`\n\n ${message}`);
    },
    levenshtein: (a, b) => {
        const dp = Array.from({ length: a.length + 1 }, (_, i) => Array(b.length + 1).fill(0));
    
        for (let i = 0; i <= a.length; i++) dp[i][0] = i;
        for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    
        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
                )
            }
        }
    
        return dp[a.length][b.length];
    },
    scoreMatch: (str, query) => {
        str = str.toLowerCase();
        query = query.toLowerCase();
    
        if (str === query) return 0;
        if (str.startsWith(query)) return 1;
        if (str.includes(query)) return 2;
    
        return 3 + module.exports.levenshtein(str, query);
    }
}