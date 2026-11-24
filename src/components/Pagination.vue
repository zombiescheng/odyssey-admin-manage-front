<script setup>
defineProps({
  totalCount: { type: Number, default: 10 },
  currentPage: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  layout: { type: String, default: 'total, sizes, prev, pager, next' },
})

const emit = defineEmits(['changeCurrent', 'changeSize'])
</script>

<template>
  <div class="pagination">
    <el-pagination
      :current-page="currentPage" :page-size="pageSize" :page-sizes="[10, 15, 20, 30, 50]"
      :total="totalCount" :layout="layout" background
      @update:current-page="emit('changeCurrent', $event)"
      @update:page-size="emit('changeSize', $event)"
    />
  </div>
</template>
