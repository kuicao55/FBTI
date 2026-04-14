# TasteType · 口味人格测试

<p align="center">
  <img src="assets/FBTI_logo.png" width="120" height="120" alt="FBTI Logo">
</p>

<p align="center">
  <strong>24 道情景题 · 发现你的味觉人格</strong>
</p>

<p align="center">
  <a href="https://github.com/kuicao55/FBTI">
    <img src="https://img.shields.io/badge/GitHub-80%20types-brightgreen?style=flat-square&logo=github" alt="80 Types">
  </a>
  <img src="https://img.shields.io/badge/platform-Web-blue?style=flat-square" alt="Platform">
  <img src="https://img.shields.io/badge/framework-Vanilla%20HTML%2FCSS%2FJS-orange?style=flat-square" alt="Framework">
</p>

---

<p align="center">
  <a href="https://kuicao55.github.io/FBTI/">
    <img src="https://img.shields.io/badge/🚀%20Live%20Demo-在线体验-27C93D?style=for-the-badge&logo=firefox" alt="Live Demo">
  </a>
</p>

---

## 什么是 TasteType？

TasteType（口味人格测试）是一个基于食品感官科学的味觉人格测试，通过 **24 道情景选择题**识别你的四维味觉人格类型。

测试基于四个独立维度构建：

| 维度 | 代码 | 倾向 |
|:---|:---:|:---|
| **刺激偏好** | H / N / C / M | 灼烧 / 麻感 / 清凉 / 温和 |
| **核心味觉引力** | U / S / W / B / O | 鲜味 / 咸味 / 甜味 / 苦醇 / 酸味 |
| **风味构建哲学** | A / S | 加法烹饪 / 减法烹饪 |
| **新奇探索指数** | E / C | 探索者 / 经典派 |

> 你可以理解为 **食物版 MBTI** —— 四维味觉人格组合出 80 种独特类型。

---

## 80 种味觉人格一览

全部 80 种人格类型（部分示例）：

| 类型码 | 名称 |
|:---:|:---|
| HUAE | 山野炼金士 |
| HUSC | 烈焰吟游诗人 |
| CWSE | 温柔探索家 |
| NWAC | 清凉经典派 |
| ... | [全部 80 种类型请访问测试结果页] |

---

## 功能特性

| 功能 | 说明 |
|:---|:---|
| 🌐 **URL 分享** | 答完题后，URL 自动包含完整结果数据（紧凑编码），分享给朋友可直接查看详细分析 |
| 🖼️ **图片分享** | 生成 3:4 竖版 PNG 分享图，包含头像、类型码、雷达图、堆叠条、QR 码 |
| 📱 **手机分享** | 支持 Web Share API，手机上可分享到微信、相册等 |
| 📊 **详细分析** | 雷达图 + 四维堆叠条可视化，展示你的味觉偏好全貌 |
| ⚡ **纯前端** | 无需后端，无需数据库，纯客户端运行 |
| 🎨 **精美设计** | 温暖的米色系 + 橙棕色点缀，优雅的字体与流畅动画 |

---

## 技术栈

- **HTML5** + **CSS3**（自定义属性设计系统）
- **Vanilla JavaScript**（零依赖 ES Module）
- **Canvas API**（分享图片生成）
- **Web Share API**（手机原生分享）
- **Google Fonts**（Noto Serif SC · Poppins · Lora）

---

## 浏览器兼容性

| 浏览器 | 支持版本 |
|:---|:---|
| Chrome | 80+ |
| Firefox | 75+ |
| Safari | 13+ |
| Edge | 80+ |

> ⚠️ 需要 HTTPS 或 `localhost` 才能使用 Web Share API 和剪贴板功能。

---

## 项目结构

```
FBTI/
├── index.html              # 完整的单文件应用
├── modules/
│   ├── render.js          # 渲染引擎（雷达图、堆叠条、Canvas 绘制）
│   └── scoring.js          # 计分引擎（题目选择、百分比计算、URL 编解码）
├── data/
│   ├── questions.json     # 题库
│   └── types.json          # 80 种人格类型数据
├── assets/
│   ├── FBTI_logo.png      # 品牌 Logo
│   ├── QR.png              # 二维码占位图
│   └── [TYPE].png          # 80 种人格头像（PNG 格式）
├── docs/
│   └── FBTI_3.1_docs/     # 项目文档
└── tests/
    ├── test_scoring.js     # 计分逻辑测试
    └── test_render.js      # 渲染逻辑测试
```

---

## 开发说明

本项目采用 TDD 开发模式，测试驱动确保计分和渲染逻辑正确。

```bash
# 本地运行
python3 -m http.server 8080
# 访问 http://localhost:8080
```

---

<p align="center">
  <img src="assets/FBTI_logo.png" width="48" height="48" alt="FBTI">
  <br>
  <sub>TasteType · 口味人格测试 · 2026</sub>
</p>
