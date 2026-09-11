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

        const result = await syncFortuneData();

        if (result.success) {
            await interaction.editReply({
                content: `✅ **구글 시트 동기화 성공!**\n- 시트 탭: \`${result.sheetName}\`\n- 적용된 항목: **오늘의 한 마디 (${result.fortunesCount}개)**, **행운의 ITem (${result.itemsCount}개)**, **행운의 미션 (${result.missionsCount}개)**`
            });
        } else {
            await interaction.editReply({
                content: `❌ **구글 시트 동기화 실패 (기본 로컬 데이터가 출력됩니다)**\n- **실패 사유**: \`${result.reason}\`\n\n📌 **체크리스트**:\n1. \`.env\`의 \`GOOGLE_SHEET_ID\`가 맞는지 확인해 주세요.\n2. \`.env\`의 \`ACTIVE_SHEET_NAME\`과 구글 시트 하단의 **탭 이름**(예: \`기본\`, \`Sheet1\`)이 토시 하나 틀리지 않고 일치하는지 확인해 주세요.\n3. 구글 시트 [공유] 설정이 **'링크가 있는 모든 사용자에게 공개 (뷰어)'** 상태인지 확인해 주세요.`
            });
        }
    }
};
