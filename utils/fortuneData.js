const { parse } = require('csv-parse/sync');

// 기본 Fallback 데이터 (구글 시트가 없거나 오류 시 사용)
const defaultFortunes = [
    "생각지도 못한 곳에서 기분 좋은 소식이 찾아옵니다.",
    "당신의 작은 선행이 오늘 큰 행운이 되어 돌아올 것입니다.",
    "고민하던 일이 곧 명쾌하게 해결될 기미가 보입니다.",
    "새로운 시도를 두려워하지 마세요. 성공의 열쇠가 될 것입니다.",
    "오늘은 스스로에게 작은 선물을 줄 완벽한 날입니다.",
    "당신의 긍정적인 에너지가 주변 사람들에게도 행복을 전합니다.",
    "오랫동안 노력해 온 일이 드디어 결실을 맺기 시작합니다.",
    "지나간 일에 연연하지 마세요. 더 멋진 미래가 기다리고 있습니다.",
    "당신의 직감을 믿으세요. 오늘의 직감은 꽤 정확합니다.",
    "작은 변화가 큰 행복을 가져다줄 것입니다."
];

const defaultItItems = [
    "애플 에어팟 프로 2세대",
    "삼성 갤럭시 버즈3 프로",
    "소니 WH-1000XM5 노이즈 캔슬링 헤드폰",
    "로지텍 MX Master 3S 무선 마우스",
    "리얼포스 무소음 기계식 키보드",
    "울트라 와이드 4K 곡면 모니터",
    "개발자 필수 대형 방수 장패드",
    "GaN 100W 초고속 3포트 충전기",
    "알루미늄 접이식 노트북 거치대"
];

const defaultMissions = [
    "좋아하는 노래 1곡 들으며 5분 동안 스트레칭하기 🎵",
    "나 자신에게 '오늘도 고생했어'라고 속으로 칭찬해 주기 👏",
    "책상 위 필요 없는 영수증이나 쓰레기 깔끔하게 정리하기 🧹",
    "따뜻하거나 시원한 물 한 잔 마시며 1분간 멍때리기 ☕",
    "오늘 작성하는 코드나 문서에 정성스러운 주석 남기기 💻",
    "오늘 하루 감사했던 소소한 일 1가지 메모장에 적어보기 📝"
];

// 메모리에 유지되는 포춘쿠키 데이터
let fortunes = [...defaultFortunes];
let itItems = [...defaultItItems];
let missions = [...defaultMissions];
let lastSyncedAt = null;

/**
 * 구글 스프레드시트에서 최신 포춘쿠키 데이터를 동기화합니다.
 */
async function syncFortuneData() {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const sheetName = process.env.ACTIVE_SHEET_NAME || '기본';

    if (!sheetId) {
        console.log('ℹ️ [포춘쿠키] GOOGLE_SHEET_ID가 설정되지 않아 기본 로컬 데이터를 사용합니다.');
        return false;
    }

    try {
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP 요청 실패 (상태 코드: ${response.status})`);
        }

        const csvText = await response.text();
        const records = parse(csvText, {
            skip_empty_lines: true,
            trim: true
        });

        // 데이터가 전혀 없을 경우
        if (records.length <= 1) {
            console.warn(`⚠️ [포춘쿠키] 시트('${sheetName}')에 데이터가 부족하여 기본 데이터를 유지합니다.`);
            return false;
        }

        // 헤더 행(첫번째 줄) 제외
        const dataRows = records.slice(1);

        const newFortunes = [];
        const newItems = [];
        const newMissions = [];

        for (const row of dataRows) {
            if (row[0] && row[0].trim()) newFortunes.push(row[0].trim());
            if (row[1] && row[1].trim()) newItems.push(row[1].trim());
            if (row[2] && row[2].trim()) newMissions.push(row[2].trim());
        }

        if (newFortunes.length > 0) fortunes = newFortunes;
        if (newItems.length > 0) itItems = newItems;
        if (newMissions.length > 0) missions = newMissions;

        lastSyncedAt = new Date();
        console.log(`✅ [포춘쿠키] 구글 시트 동기화 완료! (시트 탭: '${sheetName}', 운세: ${fortunes.length}개, ITem: ${itItems.length}개, 미션: ${missions.length}개)`);
        return true;
    } catch (error) {
        console.error('❌ [포춘쿠키] 구글 시트 동기화 중 오류 발생 (기본 데이터를 유지합니다):', error.message);
        return false;
    }
}

// 봇 시작 시 최초 동기화 및 5분 주기 자동 동기화 설정
syncFortuneData();
setInterval(syncFortuneData, 5 * 60 * 1000);

/**
 * 포춘쿠키 결과를 무작위로 생성합니다.
 */
function getFortuneCookie() {
    const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
    const item = itItems[Math.floor(Math.random() * itItems.length)];
    const mission = missions[Math.floor(Math.random() * missions.length)];

    return {
        fortune,
        item,
        mission
    };
}

module.exports = {
    getFortuneCookie,
    syncFortuneData
};
