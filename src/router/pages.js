import logRoutes from './routes/system/logs/index.js'
import productRoutes from './routes/instant/products/index.js'

export const businessRoutes = [...logRoutes, ...productRoutes]
export const pages = businessRoutes.filter(route => route.meta?.permissionCode).map(route => ({
  name: route.name,
  path: route.path,
  aliases: [route.alias].flat().filter(Boolean),
  permissionCode: route.meta.permissionCode,
  title: route.meta.title,
  section: route.meta.section,
  sectionTitle: route.meta.sectionTitle,
  cacheName: route.meta.cacheName,
}))

export const knownPaths = new Set(['/entry', ...pages.flatMap(page => [page.path, ...page.aliases])])
