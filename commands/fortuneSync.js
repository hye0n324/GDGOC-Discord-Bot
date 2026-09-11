const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { syncFortuneData } = require('../utils/fortuneData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fortune_sync')
        .setNameLocalizations({
            ko: '포춘쿠키동기화'
        })
        .setDescription('구글 스프레드시트의 최신 포춘쿠키 데이터를 수동으로 동기화합니다.')
        .setDescriptionLocalizations({
            ko: '구글 스프레드시트의 최신 포춘쿠키 데이터를 수동으로 동기화합니다.'
        })
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild), // 관리자 권한 필요

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const success = await syncFortuneData();

        if (success) {
            await interaction.editReply({
                content: `✅ **구글 시트 동기화 완료!**\n현재 시트 탭(\`${process.env.ACTIVE_SHEET_NAME || '기본'}\`)의 최신 문구가 성공적으로 적용되었습니다.`
            });
        } else {
            await interaction.editReply({
                content: `⚠️ **동기화 실패 또는 기본 데이터 유지 중**\n구글 시트 ID 설정과 '웹에 게시' 공유 권한을 확인해 주세요.`
            });
        }
    }
};
