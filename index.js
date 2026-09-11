require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
    ],
});

// 명령어 컬렉션 생성
client.commands = new Collection();
const commandsArray = [];

// commands 디렉토리에서 명령어 파일 로드
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commandsArray.push(command.data.toJSON());
            console.log(`[명령어 로드 완료] ${command.data.name}`);
        } else {
            console.warn(`[경고] ${filePath} 명령어에 "data" 또는 "execute" 속성이 없습니다.`);
        }
    }
}

// 봇이 준비되었을 때 실행되는 이벤트
client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} 로그인 완료!`);

    try {
        // 슬래시 명령어 자동 등록 (Global Slash Commands)
        console.log('🔄 슬래시 명령어를 디스코드에 등록 중...');
        await client.application.commands.set(commandsArray);
        console.log('✨ 슬래시 명령어가 성공적으로 등록되었습니다!');
    } catch (error) {
        console.error('❌ 슬래시 명령어 등록 중 오류 발생:', error);
    }
});

// 상호작용(Interaction) 처리 이벤트
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`[오류] ${interaction.commandName} 명령어를 찾을 수 없습니다.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`[명령어 실행 오류] ${interaction.commandName}:`, error);
        const errorMessage = { content: '⚠️ 명령어를 실행하는 동안 오류가 발생했습니다!', ephemeral: true };
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);