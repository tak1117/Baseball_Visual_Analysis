# --- ステージ 1: ビルド環境 (Node.js) ---
FROM node:20-alpine AS build

# 作業ディレクトリの設定
WORKDIR /app

# 依存関係ファイルのコピー
COPY package.json package-lock.json ./

# 依存関係のインストール
RUN npm ci

# ソースコードのコピー
# (csvファイルやsrcフォルダなどもここでコピーされます)
COPY . .

# ビルド実行 (Viteはデフォルトで dist フォルダに出力します)
RUN npm run build

# --- ステージ 2: 本番環境 (Nginx) ---
FROM nginx:alpine

# ビルド成果物をNginxの公開ディレクトリにコピー
COPY --from=build /app/dist /usr/share/nginx/html

# Nginxの設定ファイルをコピー
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ポート80を公開
EXPOSE 80

# Nginxを起動
CMD ["nginx", "-g", "daemon off;"]