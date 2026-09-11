const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
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
        }),

    async execute(interaction) {
        // 1. 특정 서버 ID 제한 (.env의 주석/공백 제거 파싱)
        const rawGuildId = process.env.ALLOWED_GUILD_ID || '';
        const allowedGuildId = rawGuildId.split('#')[0].trim();

        if (allowedGuildId && interaction.guildId !== allowedGuildId) {
            return await interaction.reply({
                content: `⚠️ 이 명령어는 지정된 디스코드 서버에서만 사용할 수 있습니다.`,
                flags: MessageFlags.Ephemeral
            });
        }

        // 2. 최신 유저 멤버 정보 및 역할 실시간 강제 동기화 (캐시 방지 force fetch)
        let member = interaction.member;
        if (interaction.guild && interaction.user) {
            try {
                member = await interaction.guild.members.fetch({ user: interaction.user.id, force: true });
            } catch (e) {
                // fetch 실패 시 기존 interaction.member 사용
            }
        }

        // 3. 특정 역할 ID 및 역할 이름 제한 파싱
        const rawRoleId = process.env.ALLOWED_ROLE_ID || '';
        const targetRoleId = rawRoleId.split('#')[0].trim();

        const rawRoleName = process.env.ALLOWED_ROLE_NAME || '운영진';
        const targetRoleName = rawRoleName.split('#')[0].trim();
        const targetRoleLower = targetRoleName.toLowerCase();

        // 관리자 권한 여부 체크 (최신 member 기준)
        const isAdmin = member.permissions && (
            member.permissions.has(PermissionFlagsBits.Administrator) ||
            member.permissions.has(PermissionFlagsBits.ManageGuild)
        );

        // 유저가 보유한 역할(Role) 최신 상태 검사
        let hasTargetRole = false;
        const userRoleNames = [];

        if (member && member.roles && member.roles.cache) {
            const rolesCache = member.roles.cache;
            rolesCache.forEach(r => userRoleNames.push(r.name));

            // 1순위: 역할 ID 매칭
            if (targetRoleId && rolesCache.has(targetRoleId)) {
                hasTargetRole = true;
            } else {
                // 2순위: 역할 이름 매칭
                hasTargetRole = rolesCache.some(role => {
                    const roleNameLower = role.name.trim().toLowerCase();
                    return roleNameLower === targetRoleLower || roleNameLower === '운영진' || roleNameLower === '관리자';
                });
            }
        }

        console.log(`👤 [권한 검사] 유저: ${interaction.user.tag} / 관리자권한: ${isAdmin} / 지정역할보유: ${hasTargetRole} / 보유역할목록: [${userRoleNames.join(', ')}]`);

        if (!isAdmin && !hasTargetRole) {
            return await interaction.reply({
                content: `🔒 **권한 부족**: 이 명령어는 지정된 역할(Role)을 보유하고 계시거나 서버 관리자 권한이 있으신 분만 사용할 수 있습니다.`,
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const result = await syncFortuneData();

        if (result.success) {
            const configInfo = result.detectedFromConfig 
                ? `(설정 탭에서 인식: \`${result.detectedFromConfig}\`)` 
                : `(.env 또는 기본값 적용 중)`;

            await interaction.editReply({
                content: `✅ **구글 시트 동기화 성공!**\n- **적용된 탭**: \`${result.sheetName}\` ${configInfo}\n- **동기화 항목**: 오늘의 한 마디 (${result.fortunesCount}개), 행운의 ITem (${result.itemsCount}개), 행운의 미션 (${result.missionsCount}개)`
            });
        } else {
            await interaction.editReply({
                content: `❌ **구글 시트 동기화 실패 (기본 로컬 데이터가 출력됩니다)**\n- **실패 사유**: \`${result.reason}\`\n\n📌 **체크리스트**:\n1. \`.env\`의 \`GOOGLE_SHEET_ID\`가 맞는지 확인해 주세요.\n2. 구글 시트 하단에 **'설정'** 탭이 존재하는지 확인해 주세요.\n3. 구글 시트 [공유] 설정이 **'링크가 있는 모든 사용자에게 공개 (뷰어)'** 상태인지 확인해 주세요.`
            });
        }
    }
};
