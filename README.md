# 🥠 GDGOC Discord Bot

GDGOC 디스코드 커뮤니티 및 부원들을 위한 디스코드 봇 프로젝트입니다.

---

## 🛠️ 기술 스택
- **Node.js**: `20.x`
- **npm**: `10.x`
- **discord.js**: `^14.26.4`
- **dotenv**: `^17.4.2`
- **csv-parse**: `^7.0.2` (구글 스프레드시트 CSV 데이터 연동)

---

## 📂 프로젝트 구조
```text
GDGOC_Dicord_Bot/
├── commands/            # 슬래시 명령어 모음
│   ├── fortune.js       # /포춘쿠키 (/fortune) 명령어
│   └── fortuneSync.js   # /포춘쿠키동기화 (/fortune_sync) 수동 동기화 명령어 (권한 제한)
├── utils/               # 유틸리티 및 데이터 처리 로직
│   └── fortuneData.js   # 구글 시트 연동 및 포춘쿠키 데이터 추첨 로직
├── .env                 # 환경 변수 (토큰, 구글 시트 및 권한 역할 설정 - Git 제외)
├── .gitignore           # Git 제외 파일 목록
├── index.js             # 봇 진입점 (명령어 동적 로드 & 슬래시 명령어 자동 등록)
├── package.json         # 프로젝트 패키지 관리
├── TODO.md              # 향후 개발 기획 및 아이디어 메모
└── README.md            # 프로젝트 문서
```

---

## ✨ 구현된 기능

### 1. 🥠 포춘쿠키 기능 (`/포춘쿠키` 또는 `/fortune`)
부원들에게 매일 소소한 즐거움과 소확행을 제공하는 슬래시 명령어입니다. (모든 멤버 사용 가능)

* **📜 오늘의 한 마디**: 구글 시트에서 동기화된 희망찬 운세 문구
* **💻 행운의 ITem**: 에어팟, 기계식 키보드 등 IT 전자기기 무작위 추첨
* **🎯 행운의 미션**: 스트레칭, 코드 주석 달기 등 5분 이내 실천 가능한 소확행 미션

### 2. 🔄 구글 시트 수동 동기화 (`/포춘쿠키동기화` 또는 `/fortune_sync`)
운영진 및 서버 관리자 전용 수동 동기화 명령어입니다. (특정 디스코드 역할 또는 관리자 권한 필요)

---

## 🚀 실행 및 개발 가이드

### 1. 환경 변수 설정 (`.env`)
루트 경로에 `.env` 파일을 작성합니다.
```env
DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN
GOOGLE_SHEET_ID=YOUR_GOOGLE_SHEET_ID
ACTIVE_SHEET_NAME=기본
ALLOWED_ROLE_NAME=운영진    # 수동 동기화 권한을 가질 디스코드 역할 이름 (기본값: '운영진')
```

### 2. 패키지 설치 및 봇 실행
```bash
# 의존성 패키지 설치
npm install

# 봇 실행
npm start
```
