# PixelStandard 📐 像素标准与比例换算工具

<p align="center">
  <strong>专为 AI 生成模型 (SD / Flux / ComfyUI)、视频编码压制与游戏 UI 设计打造的专业分辨率对齐与像素换算神器。</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-Fast-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=flat-square" alt="MIT License" />
  <img src="https://img.shields.io/badge/i18n-中%20%2F%20EN-orange.svg?style=flat-square" alt="i18n Support" />
</p>

---

## 💡 为什么需要 PixelStandard？

在数字图像处理、AI 绘画和视频制作中，随意指定分辨率经常会带来各种隐性灾难：
1. **AI 潜空间下采样伪影**：Stable Diffusion、SDXL、Flux 等模型通常包含 8× 或 16× 的 VAE 下采样阶段，尺寸未对齐倍数会导致黑边、拼接裂缝或画面模糊。
2. **视频编码绿边与性能下降**：H.264 / H.265 / AV1 基于宏块 (Macroblock，通常 16px 或 8px)，非对齐尺寸会导致右侧/底部出现绿线或低效的 Padding 填充。
3. **社交媒体与多端切图畸变**：手动计算比例极易产生 1~2 像素的舍入误差，导致人像变形或边框抗锯齿发虚。

**PixelStandard** 专为解决上述痛点而生，提供严格而灵活的数学级像素计算与规格管理。

---

## ✨ 核心特性

### 1. 📐 图像画幅裁剪与标准分辨率对齐 (Crop Matcher)
- **多维度基准输入**：
  - **双边基准 (宽 & 高约束)**：输入原始素材尺寸，自动计算在主流画幅比例下的最优裁剪方案与无损裁切量。
  - **单边基准 (高度/宽度)**：锁定单一维度，精准推导对应比例的最佳边长。
- **硬件与算法整除约束**：
  - 支持 **2 / 4 / 8 / 16 / 32 / 64** 任意倍数整除对齐。
  - **对齐策略自由切换**：
    - *优先遵循比例*：严格锁死目标宽高比（如 16:9、3:4），消除几何形变；
    - *优先整除倍数*：宽和高均严格整除设定倍数，彻底避免硬件编码器与 AI 模型报障。
- **常用比例全矩阵预览**：一键直观对比 16:9、4:3、3:2、1:1、21:9、9:16、4:5、9:21 等常见画幅的最优方案。
- **自动规格联想**：智能推荐与当前画幅最贴合的行业标准分辨率（如 1080p、2K QHD、4K UHD 等）。

### 2. 🔍 像素倍率缩放与总像素量换算 (Pixel Scaler)
- **原图分辨率 × 缩放倍率**（默认主界面）：
  - 快速倍率预设（0.25x, 0.5x, 0.75x, 1.25x, 1.5x, 2x, 3x, 4x）与自由滑块调节。
  - 缩放结果实时整除对齐，保障 Upscale 后继续符合模型与编码器要求。
- **设定目标总像素量 (Megapixels)**：
  - 指定目标百万像素数（如 1MP, 2MP, 4MP, 8MP, 16MP 等）。
  - 根据原图比例自动推导对应的物理长宽尺寸，毫秒级计算无误差。
- **规格阶梯表**：一览 25% 到 400% 各档位的精确像素、总像素量与尺寸对比。

### 3. 📚 标准分辨率库与自定义标准中心 (Resolution Library)
- **海量内置工业规范**：收录影视电影 (DCI 4K/2K)、超清显示 (8K/4K/2K/1080p)、摄影胶片画幅、主流社交媒体平台推荐尺寸。
- **用户自定义分辨率体系**：
  - 随时创建专属的分辨率标准（名称、分类、宽、高、比例、说明标签）。
  - 支持实时编辑、删除，本地 `localStorage` 自动持久化保存。
  - 一键将任意库中分辨率注入到裁剪器或缩放器中进行二阶处理。

### 4. 📁 本地媒体无损尺寸探针 (Local Inspector)
- 支持直接拖拽或选取本地图片/视频文件。
- 纯前端本地安全解析，不上传任何服务器，保护隐私。
- 秒级读取物理像素宽高、原生比例、像素总量 (MP) 与文件大小，支持一键载入工作流。

### 5. 🌐 完整中英文国际化 (Bilingual i18n)
- 顶部导航栏一键无缝切换**中文 (简体)** 与 **English**。
- 语言设置持久化存储，全球创作者即开即用。

---

## 🛠️ 技术栈

- **Core**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Persistence**: Web LocalStorage API (zero backend required)

---

## 🚀 本地开发与快速运行

### 前置要求
- [Node.js](https://nodejs.org/) (>= 18.0.0)
- npm / pnpm / yarn / bun

### 安装运行

```bash
# 1. 克隆仓库
git clone https://github.com/<your-username>/pixel-standard.git
cd pixel-standard

# 2. 安装依赖
npm install

# 3. 启动本地开发服务 (默认端口 3000)
npm run dev
```

启动后在浏览器打开 `http://localhost:3000` 即可体验。

### 生产打包

```bash
npm run build
```
打包输出物将位于 `dist/` 目录，可直接部署至 Cloudflare Pages、Vercel、GitHub Pages 或任意静态托管服务。

---

## 🎯 典型应用场景

| 场景 | 痛点 | PixelStandard 解决方案 |
| :--- | :--- | :--- |
| **Stable Diffusion / ComfyUI** | 宽高未整除 8 或 16 产生接缝黑边，显存易爆 | 选择 8/16/32 模数对齐，精准换算 1MP/2MP 等最佳潜空间分辨率 |
| **视频编码 (H.264/HEVC/AV1)** | 奇数像素导致转码报错、绿色边框条纹 | 强制 16 像素宏块整除，保证硬件编码加速平稳 |
| **社交媒体封面 (B站/小红书/IG)** | 平台推荐尺寸比例复杂，人工缩放裁切失真 | 标准库一键载入官方画幅，智能对齐裁剪多余像素 |
| **游戏开发与纹理贴图** | GPU 纹理显存对齐要求严格 | 一键匹配 2 的幂次或特定步长约束 |

---

## 🤝 贡献与反馈

欢迎提交 Issue 或 Pull Request！
如果你有更多希望内置的标准分辨率（如特定摄影机传感器比例、新社交平台规范），欢迎提交建议。

---

## 📄 License

本项目采用 [MIT License](LICENSE) 开源协议。
