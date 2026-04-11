# FBTI 模块化拆分设计

**Date:** 2026-04-11
**Status:** Draft

## Goal

将 FBTI 单文件应用 (index.html) 拆分为独立模块,使人格分类、题库、人格图片、评分流程可以独立更新,互不影响。

## Architecture

整体分为 5 层:

```
数据层 (JSON) → 接口层 (loader) → 引擎层 (scoring) → 渲染层 (render) → 入口层 (index.html)
```

- **数据层**: `data/*.json` — 运营人员直接编辑,无需开发者介入
- **接口层**: `modules/loader.js` — 统一加载 data/ 下的 JSON 文件
- **引擎层**: `modules/scoring.js` — 评分逻辑,与数据隔离
- **渲染层**: `modules/render.js` — UI 渲染逻辑
- **入口层**: `index.html` — 初始化和事件绑定,不含业务数据

## Components

### data/types.json

人格分类定义文件。评分引擎只读取 `dimensions` 字段,渲染层读取展示相关字段。

```json
{
  "types": {
    "SCNU": {
      "name": "烈焰暴君",
      "tagline": "...",
      "desc": "...",
      "dimensions": {
        "stimulus": "S",
        "crunch": "C",
        "neophilic": "N",
        "umami": "U"
      }
    }
  }
}
```

### data/questions.json

题库定义文件。包含题目内容和各维度配置。

```json
{
  "dimensions": ["stimulus", "crunch", "neophilic", "umami"],
  "questions": [
    {
      "id": 1,
      "text": "...",
      "dimension": "stimulus",
      "options": [
        { "label": "A", "value": 1 },
        { "label": "B", "value": 0 },
        { "label": "C", "value": 0 },
        { "label": "D", "value": 0.5 }
      ]
    }
  ]
}
```

### modules/loader.js

统一数据加载接口。负责 fetch data/*.json,提供缓存机制避免重复请求。

### modules/scoring.js

评分引擎。接收 answers/questions/types,返回计算结果。

```js
// 输出接口
calculateType(answers, questions, types) → {
  typeCode: "SCNU",
  scores: { stimulus: 3, ... },
  dimensionResults: { stimulus: "S", ... }
}
```

### modules/render.js

渲染引擎。负责题目渲染、结果渲染、SVG 头像加载。

### assets/*.svg

16 个人格 SVG 头像文件。直接替换文件即可更新,无需改代码。

## Data Flow

```
用户答题 → render.js(渲染题目)
         → 用户提交 → scoring.js(评分)
         → 返回 { typeCode, scores, dimensionResults }
         → render.js(渲染结果,引用 assets/*.svg)
```

## Error Handling

- JSON 加载失败: 显示友好错误提示,不影响页面其他功能
- 未知人格代码 (URL分享): fallback 到默认人格或错误提示
- 题目数据不完整: 由 loader 做基础校验,评分引擎做防御处理

## Testing Strategy

- 每个模块独立测试: loader、scoring、render 可单独 unit test
- 端到端测试: 完整答题流程覆盖
- 回归测试: 人格/题目数据变更后自动验证评分结果一致性

## Out of Scope

- 不包含多端复用 (App/小程序) 架构,专注当前 Web 版本
- 不引入构建工具,纯 ES Module + 原生浏览器支持
- 不修改现有 SVG 头像文件格式

## Deployment

GitHub Pages 直接支持 —— 所有文件为静态资源,ES Module 可在现代浏览器直接运行,无需打包构建。

## Migration

1. 创建 `data/types.json`, `data/questions.json` 并写入当前数据
2. 创建 `modules/scoring.js`, `modules/render.js`, `modules/loader.js`
3. 修改 `index.html` — 保留 UI 结构,移除内联数据/逻辑,改为 import
4. 验证后 Push → GitHub Pages 自动生效

零停机,无数据迁移风险 (JSON 为新文件)。
