# Astro Branding

這是一個使用 Astro 製作的形象網站範例，已可直接部署到 Cloudflare Pages。

## 什麼是 Astro
Astro 是一個現代前端框架，適合製作內容型網站、形象網站、部落格與高效能靜態網站。
它使用 `.astro` 檔案來組合版型與元件，預設產生靜態 HTML，因此速度快、結構清楚，也很適合部署到 Cloudflare Pages。

## 專案結構
- `src/layouts/BaseLayout.astro`：共用版型
- `src/pages/index.astro`：首頁
- `public/styles/global.css`：樣式檔
- `astro.config.mjs`：Astro 設定

## 本機開發
```bash
npm install
npm run dev
```

## Cloudflare Pages 設定
- Framework preset: `Astro`
- Build command: `npm run build`
- Build output directory: `dist`

## 說明
- 所有按鈕與導覽連結皆可正常使用
- 可直接替換成正式品牌內容
