const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getFortuneCookie } = require('../utils/fortuneData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fortune')
        .setNameLocalizations({
            ko: '포춘쿠키'
        })
        .setDescription('오늘의 운세, 행의 ITem, 행운의 미션을 포춘쿠키에서 확인합니다.')
        .setDescriptionLocalizations({
            ko: '오늘의 운세, 행의 ITem, 행운의 미션을 포춘쿠키에서 확인합니다.'
        }),

    async execute(interaction) {
        const { fortune, item, mission } = getFortuneCookie();
        const userName = interaction.user.displayName || interaction.user.username;

        const fortuneEmbed = new EmbedBuilder()
            .setTitle(`🥠 ${userName} 님의 포춘쿠키 결과`)
            .setColor('#FFB800') // 포춘쿠키 느낌의 따뜻한 골드 컬러
            .addFields(
                {
                    name: '📜 오늘의 한 마디',
                    value: `> "${fortune}"`,
                    inline: false
                },
                {
                    name: '💻 행운의 ITem',
                    value: `\`${item}\``,
                    inline: false
                },
                {
                    name: '🎯 행운의 미션',
                    value: `> ${mission}`,
                    inline: false
                }
            )
            .setFooter({ text: 'GDGOC Fortune Bot • 오늘 하루도 행운과 소확행이 가득하기를!' })
            .setTimestamp();

        await interaction.reply({ embeds: [fortuneEmbed] });
    }
};
