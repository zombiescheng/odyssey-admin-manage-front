export default [{
  name: 'instant.products.list',
  path: '/V8/instant-product-micro-app/instant-product/manage-product',
  component: () => import('../../../../views/instant/products/ProductListView.vue'),
  meta: { permissionCode: 'manageProduct', title: '产品管理', section: 'instant', sectionTitle: t => t('即开管理'), cacheName: 'ProductListView' },
}]
