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

        // 2. 특정 역할 ID 및 역할 이름 제한 파싱
        const rawRoleId = process.env.ALLOWED_ROLE_ID || '';
        const targetRoleId = rawRoleId.split('#')[0].trim();

        const rawRoleName = process.env.ALLOWED_ROLE_NAME || '운영진';
        const targetRoleName = rawRoleName.split('#')[0].trim();
        const targetRoleLower = targetRoleName.toLowerCase();

        // 관리자 권한 여부 체크
        const memberPerms = interaction.memberPermissions;
        const isAdmin = memberPerms && (
            memberPerms.has(PermissionFlagsBits.Administrator) ||
            memberPerms.has(PermissionFlagsBits.ManageGuild)
        );

        // 3. 유저가 보유한 역할(Role) ID/이름 완벽 파싱 (Raw Payload Array & Guild Role Cache)
        let hasTargetRole = false;
        const userRoleDetails = [];

        if (interaction.member && interaction.member.roles) {
            const memberRoles = interaction.member.roles;

            // 디스코드 API Raw Roles Array (역할 ID 배열)
            let roleIds = [];
            if (Array.isArray(memberRoles)) {
                roleIds = memberRoles;
            } else if (memberRoles.cache) {
                roleIds = Array.from(memberRoles.cache.keys());
            }

            // Target Role ID 매칭 확인 (1순위)
            if (targetRoleId && roleIds.includes(targetRoleId)) {
                hasTargetRole = true;
            }

            // 서버 전체 역할 정보(Guild Roles)에서 이름 매칭 및 로깅용 정보 수집 (2순위)
            if (interaction.guild && interaction.guild.roles) {
                for (const rId of roleIds) {
                    const role = interaction.guild.roles.cache.get(rId);
                    if (role) {
                        userRoleDetails.push(`${role.name}(${role.id})`);
                        const roleNameLower = role.name.trim().toLowerCase();
                        if (roleNameLower === targetRoleLower || roleNameLower === '운영진' || roleNameLower === '관리자') {
                            hasTargetRole = true;
                        }
                    } else {
                        userRoleDetails.push(`ID:${rId}`);
                    }
                }
            }
        }

        console.log(`👤 [권한 검사] 유저: ${interaction.user.tag} / 관리자권한: ${isAdmin} / 지정역할보유: ${hasTargetRole} / 보유역할목록: [${userRoleDetails.join(', ')}]`);

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
