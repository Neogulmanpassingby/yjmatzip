# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

성균관대 자연과학캠퍼스(율전동) 맛집 랜덤 추천 및 지도 표시 서비스.

## 기술 스택

- **Framework:** Vite + React (TypeScript)
- **Styling:** Tailwind CSS
- **Map API:** Kakao Maps SDK (`react-kakao-maps-sdk`)

## 주요 명령어

```bash
npm install       # 의존성 설치
npm run dev       # 개발 서버 실행
npm run build     # 프로덕션 빌드
```

## 프로젝트 규칙

- 모든 컴포넌트는 `src/components/` 폴더에 생성한다.
- Kakao Maps API 키는 `.env` 파일의 `VITE_KAKAOMAP_KEY` 환경 변수로 관리한다.
- 율전동 주요 지점(성균관대역, 정문, 쪽문 등)의 좌표를 기준으로 기능을 구현한다.
- 맛집 필터링 등 로직은 효율적인 알고리즘을 지향한다.
