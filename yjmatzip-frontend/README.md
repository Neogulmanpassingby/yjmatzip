# 율전 맛집 지도 (yjmatzip)

성균관대 자연과학캠퍼스(율전동) 맛집 랜덤 추천 및 카카오 지도 표시 서비스.

## 기술 스택

- **Framework:** Vite + React (TypeScript)
- **Styling:** Tailwind CSS
- **Map API:** Kakao Maps SDK (`react-kakao-maps-sdk`)

## 시작하기

```bash
npm install   # 의존성 설치
npm run dev   # 개발 서버 실행
npm run build # 프로덕션 빌드
```

## 환경 변수

`.env` 파일을 루트에 생성하고 아래 값을 설정하세요.

```
VITE_KAKAOMAP_KEY=your_kakao_map_api_key
```
