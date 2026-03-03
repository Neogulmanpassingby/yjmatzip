# 1단계: 빌드 환경 (Node.js)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_KAKAOMAP_KEY
ARG VITE_API_BASE_URL
ENV VITE_KAKAOMAP_KEY=$VITE_KAKAOMAP_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
# 여기서 Vite(또는 CRA) 빌드가 실행되고 dist 폴더가 생성됩니다.
RUN npm run build

# 2단계: 실행 환경 (가벼운 Nginx 웹 서버)
FROM nginx:alpine
# 빌드된 정적 파일(HTML, JS, CSS)만 Nginx의 서빙 폴더로 쏙 빼옵니다.
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx는 기본적으로 80 포트를 사용합니다.
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
