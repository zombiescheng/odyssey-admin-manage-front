# Odyssey 管理后台 · Vue 3 迁移试点

本目录是独立项目。它使用 JavaScript、Vue 3、Vite、Vue Router、Pinia、Element Plus 和 VoerkaI18n。主应用与已迁入的业务页面共用一个入口和一个路由实例，页面按路由加载。

## 本地体验

需要 Node.js 22.13 或更高版本。以下命令从本目录运行。

~~~sh
npm ci
npm run dev:demo
~~~

打开 http://127.0.0.1:5175/ 。管理后台的登录页提供管理员和审计员两个本地演示入口。管理员可以访问两个试点页面，审计员需完成页面给出的双因子认证，只能访问操作日志。

演示模式使用本地数据，仅在 Vite 开发服务器以 demo 模式启动时启用。生产构建默认连接真实接口。

## 首批页面

| 页面 | 旧链接 | 接入范围 |
| --- | --- | --- |
| 操作日志 | #/system-manage/log-list 或 #/V8/system-manage/log-list | 日期、用户和模块筛选、分页、详情 |
| 即开产品管理 | #/V8/instant-product-micro-app/instant-product/manage-product | 产品列表、编号和状态筛选、分页 |

登录后使用后端资源树生成已迁移页面的菜单，路由同时检查资源权限。刷新时重新获取个人资料和资源树。标签页保存在本项目独立的会话存储中，关闭时释放页面缓存。产品新增、详情、其他业务页面、动态报表、历史表单设计器和仪表盘仍待迁移。

登录流程覆盖双因子验证码、恢复码验证和首次绑定。绑定完成后，页面显示新生成的恢复码，确认保存后返回登录。

## 目录约定

三个目录共用以下一级业务域。后续增加业务子层级时，沿用同一个相对路径，例如 `instant/warehouse/transfers`。

| 目录名 | 业务 |
| --- | --- |
| `system` | 系统管理 |
| `site` | 站点和零售商后台 |
| `customer` | 客户管理 |
| `instant` | 即开管理 |
| `digital-instant` | 数字即开 |
| `draw` | 开奖管理 |
| `promotion` | 促销管理 |

待接入的业务域通过 `.gitkeep` 保留目录。登录、工作台和公共客户端按原有职责归档。

`router/routes/`、`views/` 和 `api/` 使用相同的业务相对路径，目录名使用 kebab-case。例如 `system/logs` 在三处分别对应路由配置、页面和操作日志接口。业务再细分时，沿用同一个分组名称和层级。列表、详情和编辑按文件名或导出函数名区分。

| 业务 | 路由 | 页面 | 接口 |
| --- | --- | --- | --- |
| 登录 | `router/routes/auth/login/index.js` | `views/auth/login/LoginView.vue` | `api/auth/login/index.js` |
| 操作日志 | `router/routes/system/logs/index.js` | `views/system/logs/LogListView.vue` | `api/system/logs/index.js` |
| 即开产品 | `router/routes/instant/products/index.js` | `views/instant/products/ProductListView.vue` | `api/instant/products/index.js` |

内部路由名沿用业务路径，例如 `system.logs.list`。原有访问路径和后端权限码在同一条路由记录中显式配置。通用请求客户端放在 `api/clients/`，布局放在 `layouts/`，公共分页组件放在 `components/`，会话状态放在 `stores/`。

## 国际化

登录页和后台顶部支持简体中文、英语和葡萄牙语切换。VoerkaI18n 记住本应用的语言选择。语言选择同时更新页面、Element Plus 和后续 API 请求。UI 的 `pt-PT` 对应接口语言 `pt`，`VITE_API_LANGUAGE` 可用于网关要求固定语言的环境。

- 在 Vue 模板中用 `t('产品管理')` 包裹文案。在普通 JavaScript 中从 `src/languages/index.js` 导入 `t`。
- 运行 `npm run i18n:extract` 提取文案。在默认词典 `src/languages/translates/messages/default.json` 中填写或修改译文。
- 运行 `npm run i18n:compile` 生成语言包和 ID 映射。启动开发服务、构建和测试时会自动编译。开发服务运行期间改译文后，可以编译并刷新页面。
- Git 跟踪默认词典、语言设置和翻译提示模板。编译产物、备份和本机 `api.json` 已忽略。

## 连接原后端

复制 .env.example 为 .env.development.local，配置联调网关，并通过团队现有配置渠道提供原系统的登录协议参数。VITE_ 前缀的值会进入前端构建。OAuth 客户端 Authorization 由开发代理或部署网关注入，配置在服务端。

~~~sh
npm run dev
npm test
npm run build
npm run preview
~~~

默认系统接口前缀为 /api，即开接口前缀为 /api/instant/api。分别使用独立的 Axios 实例。部署时由同源网关将这两个路径转发给原服务，保持现有的权限和会话校验。登录页面的旧协议加密使用浏览器 Web Crypto，联调部署需要 HTTPS。本项目可开发启动和打包，切换线上入口前需用测试租户验证登录、权限资源、菜单、日志和即开接口。
