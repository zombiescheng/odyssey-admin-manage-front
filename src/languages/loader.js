import zhCn from './messages/zh-CN.mjs'

export default {
  'zh-CN': zhCn,
  'en-US': () => import('./messages/en-US.mjs'),
  'pt-PT': () => import('./messages/pt-PT.mjs'),
}
