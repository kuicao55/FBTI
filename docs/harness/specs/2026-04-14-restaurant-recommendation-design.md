# 餐厅推荐功能设计

**Date:** 2026-04-14
**Status:** Draft

## Goal

在结果页为人格类型添加推荐餐厅功能：用户可提交餐厅推荐，同一完整类型（4字母，如 `HUAE`）的其他用户可看到该推荐。

## Architecture

静态网站方案：维护 `data/restaurants.json` 文件，存储所有人格类型的餐厅推荐数据。用户提交后直接写入文件并重新部署（或用户手动追加到 JSON）。

## 数据文件

### `data/restaurants.json`

```json
{
  "HUAE": [
    { "name": "上海·鼎泰丰", "by": "小王", "date": "2026-04-14" },
    { "name": "台州·新荣记", "by": "匿名用户", "date": "2026-04-13" }
  ],
  "SCNU": [
    { "name": "成都·玉林串串香", "by": "阿杰", "date": "2026-04-12" }
  ],
  ...其他 78 个人格类型
}
```

- Key：完整4字母人格类型代码（如 `HUAE`、`SCNU`）
- Value：数组，每项包含 `name`（地名·餐厅名）、`by`（昵称，选填默认为"匿名用户"）、`date`（提交日期）
- 数组最大长度：5（上限可配置）

### `data/restaurant-settings.json`

```json
{
  "maxPerType": 5,
  "requireReview": false
}
```

- `maxPerType`：每人格类型的推荐上限，默认 5
- `requireReview`：是否需要审核（仅 GitHub Pages 场景有意义，自托管始终 false）

## Components

### 1. 餐厅推荐区块（UI 组件）

- **位置**：结果页，自述文字之后、"查看详细分析"按钮之前
- **外观**：半透明白色卡片（`rgba(255,255,255,0.05)`），边框 `rgba(255,255,255,0.1)`，圆角 16px，与详情面板风格一致
- **内容**：
  - 标题行：`推荐餐厅` + 图标 + `n / 5` 计数器
  - 餐厅列表：橙色圆点 + 餐厅名称 + `by 昵称`
  - 底部按钮：`添加推荐`（虚线边框，半透明背景）
  - 若已达上限：显示"该人格已有 5 条推荐上限，不再接受新的推荐"

### 2. 提交弹窗（Modal）

- **标题**：推荐餐厅
- **副标题**：`为 {类型代码} 型人格推荐 · 口味相近的人会看到`
- **表单**：
  - `地名·餐厅名称 *`：必填，最大30字符，placeholder `上海·鼎泰丰`
  - `你的昵称（选填）`：最大20字符，placeholder `例如：小王`，不填显示"匿名用户"
- **按钮**：提交 / 取消
- **交互**：点击遮罩层或按 Esc 关闭

### 3. 数据加载模块（loader.js 扩展）

- 新增 `loadRestaurants()` 函数：fetch `data/restaurants.json`，返回推荐数据对象
- 加载失败时返回空对象 `{}`（不影响人格结果显示）

### 4. 餐厅渲染模块（render.js 扩展）

- 新增 `renderRestaurantSection(container, typeCode, restaurants)` 函数：
  - 接收容器元素、人格代码、该类型餐厅数组
  - 若数组为空，不渲染区块
  - 若已达上限，`添加推荐`按钮替换为上限提示文案
- 新增 `openRestaurantModal(typeCode)` 函数：打开提交弹窗

### 5. 提交处理逻辑（index.html 内联脚本扩展）

- `submitRestaurant(typeCode, name, nick)` 函数：
  - 校验餐厅名非空
  - 读取 `data/restaurants.json`
  - 检查该类型餐厅数量是否已达上限
  - 追加新推荐：`{ name, by: nick || '匿名用户', date: YYYY-MM-DD }`
  - 调用保存函数
  - 关闭弹窗并刷新列表

### 6. 数据保存机制

**自托管场景（你直接部署）**：
- 用户提交 → 显示 Toast"提交成功" → 同时触发文件下载（`restaurants.json` 的完整内容供你复制到本地文件）
- 或者：界面提示"请将以下内容追加到 restaurants.json"，展示 JSON 代码块

**GitHub Pages 场景**：
- 用户提交 → 生成包含更新后 `restaurants.json` 内容的 GitHub Issue body，或生成预填好的 PR diff
- 管理员审核后 Merge

（本次实现先做自托管方案：提交后生成修改后的 JSON 文件供下载 + Toast 提示"推荐已添加，请刷新"）

## 数据流

```
用户提交 → validate name → check limit (from restaurant-settings.json)
         → append to local array → save to localStorage (for immediate display)
                                 → trigger JSON download (for manual deploy)
         → re-render restaurant list
```

## Error Handling

| 情况 | 处理 |
|------|------|
| 餐厅数量已达上限 | 显示上限提示，按钮置灰 |
| 餐厅名称为空 | 输入框边框变橙色，阻止提交 |
| JSON 文件加载失败 | 静默返回空对象，不显示推荐区块 |
| localStorage 不可用 | 提交后只触发下载，不存本地缓存 |

## Testing Strategy

- `loadRestaurants()` 正常加载和加载失败场景
- `renderRestaurantSection()` 空列表、满5条、超限场景的渲染正确性
- `submitRestaurant()` 校验逻辑、空格处理、localStorage 读写

## Out of Scope

- GitHub PR 自动生成（自托管场景不需要，后续如需可扩展）
- 餐厅搜索/过滤功能
- 餐厅推荐排序（按时间倒序即可）
- 头像/图片上传

## 文件变更清单

| 文件 | 变更内容 |
|------|----------|
| `data/restaurants.json` | 新建，初始为空对象 `{}` |
| `data/restaurant-settings.json` | 新建，`maxPerType: 5` |
| `modules/loader.js` | 新增 `loadRestaurants()` |
| `modules/render.js` | 新增 `renderRestaurantSection()`、`openRestaurantModal()` |
| `index.html` | 引入餐厅区块 HTML、Modal HTML、提交逻辑 |
| `tests/test_render.js` | 新增餐厅渲染相关测试 |
