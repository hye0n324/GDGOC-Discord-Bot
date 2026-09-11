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
let currentActiveSheetName = '기본';

/**
 * 1단계: '설정' 탭에서 C4:I8 드롭다운에 지정된 활성화 탭 이름을 정확히 추출합니다.
 */
async function fetchActiveSheetName(sheetId) {
    try {
        const configUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('설정')}&_t=${Date.now()}`;
        const res = await fetch(configUrl, {
            headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
        });

        if (!res.ok) {
            console.log(`ℹ️ [설정 탭] '설정' 탭 요청 실패 (상태 코드: ${res.status})`);
            return null;
        }

        const csvText = await res.text();
        if (csvText.includes('<!DOCTYPE html>') || csvText.includes('<html')) {
            console.log("ℹ️ [설정 탭] '설정' 탭이 공개되지 않았거나 존재하지 않습니다.");
            return null;
        }

        const records = parse(csvText, { skip_empty_lines: true, trim: true });

        console.log(`🔍 [설정 탭 CSV 파싱] 전체 유효 행 개수: ${records.length}`);

        // 유효하지 않은 안내문/설명글 단어 필터링 함수
        const isGuideText = (str) => {
            if (!str) return true;
            if (str.length > 15) return true; // 탭 이름이 15자 이상일 리 없으므로 길면 안내문으로 간주
            const keywords = ['설정', '안내', '제공하는', '기능', '시트입니다', 'GDGOC', '운세', '현재', '선택', '드롭다운'];
            return keywords.some(kw => str.includes(kw));
        };

        let selectedTab = null;

        // 1순위: C열 (col index = 2) 전체 행 탐색 (C4:I8 병합 셀의 가장 좌측인 C열 탐색)
        for (let r = 0; r < records.length; r++) {
            if (records[r] && records[r][2]) {
                const val = records[r][2].trim();
                if (val && !isGuideText(val)) {
                    selectedTab = val;
                    console.log(`✅ [설정 탭] C열에서 드롭다운 선택값 발견: "${selectedTab}" (${r + 1}번째 유효행 C열)`);
                    break;
                }
            }
        }

        // 2순위: 혹시 C열이 아닌 다른 열에 위치할 경우 시트 전체 탐색
        if (!selectedTab) {
            for (let r = 0; r < Math.min(records.length, 15); r++) {
                for (let c = 0; c < Math.min(records[r].length, 15); c++) {
                    const val = records[r][c] ? records[r][c].trim() : '';
                    if (val && !isGuideText(val)) {
                        selectedTab = val;
                        console.log(`✅ [설정 탭] 전체 탐색을 통해 드롭다운 선택값 발견: "${selectedTab}" (${r + 1}행 ${c + 1}열)`);
                        break;
                    }
                }
                if (selectedTab) break;
            }
        }

        return selectedTab || null;
    } catch (err) {
        console.warn('⚠️ [설정 탭] 읽기 실패:', err.message);
        return null;
    }
}

/**
 * 2단계: 구글 스프레드시트에서 최신 포춘쿠키 데이터를 동기화합니다.
 */
async function syncFortuneData() {
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!sheetId || sheetId === 'YOUR_GOOGLE_SHEET_ID' || sheetId === '추출한_구글_시트_ID') {
        console.log('ℹ️ [포춘쿠키] GOOGLE_SHEET_ID가 설정되지 않아 기본 로컬 데이터를 사용합니다.');
        return { success: false, reason: 'GOOGLE_SHEET_ID가 설정되지 않음 (기본 데이터 사용 중)' };
    }

    try {
        // 1단계: '설정' 탭에서 활성화 탭 이름 읽기
        const activeTabFromConfig = await fetchActiveSheetName(sheetId);
        const sheetName = activeTabFromConfig || process.env.ACTIVE_SHEET_NAME || '기본';
        currentActiveSheetName = sheetName;

        console.log(`🎯 [포춘쿠키] 최종 대상 탭 결정: '${sheetName}' (설정 탭 읽기: ${activeTabFromConfig ? `'${activeTabFromConfig}'` : '실패/기본값 사용'})`);

        // 2단계: 대상 탭 데이터 읽기
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&_t=${Date.now()}`;
        const response = await fetch(url, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText} (시트 '${sheetName}' 접근 실패)`);
        }

        const csvText = await response.text();

        if (csvText.includes('<!DOCTYPE html>') || csvText.includes('<html')) {
            throw new Error('시트가 공개되지 않았습니다. 공유 설정을 "링크가 있는 모든 사용자에게 공개"로 설정해 주세요.');
        }

        const records = parse(csvText, {
            skip_empty_lines: true,
            trim: true
        });

        if (records.length === 0) {
            throw new Error(`시트 탭('${sheetName}')의 내용을 읽을 수 없습니다. 탭 이름을 확인해 주세요.`);
        }

        // 데이터 파싱 (1행이 헤더인지 판단)
        let dataRows = records;
        if (records.length > 1 && (records[0][0].includes('오늘') || records[0][0].includes('한 마디') || records[0][0].includes('운세') || records[0][0].includes('컬럼') || records[0][0].includes('Column'))) {
            dataRows = records.slice(1);
        }

        const newFortunes = [];
        const newItems = [];
        const newMissions = [];

        for (const row of dataRows) {
            if (row[0] && row[0].trim()) newFortunes.push(row[0].trim());
            if (row[1] && row[1].trim()) newItems.push(row[1].trim());
            if (row[2] && row[2].trim()) newMissions.push(row[2].trim());
        }

        if (newFortunes.length === 0 && newItems.length === 0 && newMissions.length === 0) {
            throw new Error(`시트('${sheetName}')에서 파싱된 유효한 데이터가 없습니다.`);
        }

        if (newFortunes.length > 0) fortunes = newFortunes;
        if (newItems.length > 0) itItems = newItems;
        if (newMissions.length > 0) missions = newMissions;

        console.log(`✅ [포춘쿠키] 구글 시트 동기화 완료! (적용된 탭: '${sheetName}', 운세: ${fortunes.length}개, ITem: ${itItems.length}개, 미션: ${missions.length}개)`);

        return {
            success: true,
            sheetName,
            fortunesCount: fortunes.length,
            itemsCount: itItems.length,
            missionsCount: missions.length,
            detectedFromConfig: activeTabFromConfig
        };
    } catch (error) {
        console.error('❌ [포춘쿠키] 구글 시트 동기화 실패:', error.message);
        return { success: false, reason: error.message };
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
