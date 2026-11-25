<script setup>
import { useVoerkaI18n } from '@voerkai18n/vue'
import { i18nScope } from '../../../languages/index.js'
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { SessionExpired } from '../../../api/clients/index.js'
import { listLogs } from '../../../api/system/logs/index.js'
import Pagination from '../../../components/Pagination.vue'
import { useSession } from '../../../stores/session.js'

defineOptions({ name: 'LogListView' })

function defaultRange() {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 7)
  return [start, end]
}
const range = ref(defaultRange())
const user = ref('')
const moduleName = ref('')
const detail = ref()
const detailOpen = ref(false)
const { activeLanguage, t } = useVoerkaI18n(i18nScope)
const session = useSession()
const router = useRouter()
const rows = shallowRef([])
const loading = ref(false)
const error = ref('')
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(20)
const appliedFilters = shallowRef({})
let pending

async function load() {
  const credential = session.current?.credential
  if (!credential) return
  pending?.abort()
  const controller = new AbortController()
  pending = controller
  loading.value = true
  error.value = ''
  try {
    const query = { ...appliedFilters.value, pageNum: pageNum.value, pageSize: pageSize.value }
    const result = await listLogs(query, credential, controller.signal)
    if (controller.signal.aborted) return
    rows.value = result.records ?? []
    total.value = Number(result.total) || 0
  } catch (cause) {
    if (controller.signal.aborted) return
    if (cause instanceof SessionExpired && session.current?.credential === credential) {
      session.expire()
      await router.replace({ name: 'auth.login', query: { redirect: router.currentRoute.value.fullPath } })
    } else {
      rows.value = []
      total.value = 0
      error.value = cause instanceof Error ? cause.message : t('加载失败，请重试。')
    }
  } finally {
    if (pending === controller) {
      pending = undefined
      loading.value = false
    }
  }
}

function search() {
  pageNum.value = 1
  appliedFilters.value = {
    createBy: user.value.trim() || undefined,
    module: moduleName.value.trim() || undefined,
    startTimeStart: range.value?.[0].getTime(),
    startTimeEnd: range.value?.[1].getTime(),
  }
}

function changePageSize(size) {
  pageSize.value = size
  pageNum.value = 1
}

watch([appliedFilters, pageNum, pageSize], load)
onBeforeUnmount(() => pending?.abort())

function reset() {
  range.value = defaultRange()
  user.value = ''
  moduleName.value = ''
  return search()
}
function showDetail(row) {
  detail.value = row
  detailOpen.value = true
}
function dateText(value) {
  if (value == null || value === '') return '—'
  const date = new Date(typeof value === 'string' && /^\d{13}$/.test(value) ? Number(value) : value)
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat(activeLanguage.value, {
    dateStyle: 'short', timeStyle: 'medium', hour12: false,
  }).format(date)
}
function jsonText(value) {
  if (value == null || value === '') return '—'
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2)
    } catch {
      return value
    }
  }
  return JSON.stringify(value, null, 2)
}
onMounted(search)
</script>

<template>
  <section>
    <header class="page-heading"><h1>{{ t('操作日志') }}</h1></header>
    <div class="panel">
      {{ t("测试国际化") }}
      {{ t("测试脚本") }}
      <form class="filters" @submit.prevent="search">
        <label class="range-field">
          <span>{{ t('操作时间') }}</span>
          <el-date-picker v-model="range" type="datetimerange" :range-separator="t('至')"
            :start-placeholder="t('开始时间')" :end-placeholder="t('结束时间')" format="YYYY-MM-DD HH:mm:ss"
            :aria-label="t('操作时间')" />
        </label>
        <label>
          <span>{{ t('用户') }}</span>
          <el-input v-model="user" :placeholder="t('输入用户名')" clearable />
        </label>
        <label>
          <span>{{ t('模块') }}</span>
          <el-input v-model="moduleName" :placeholder="t('输入模块名')" clearable />
        </label>
        <div class="filter-actions">
          <el-button native-type="submit" type="primary" :loading="loading">{{ t('查询') }}</el-button>
          <el-button @click="reset">{{ t('重置') }}</el-button>
        </div>
      </form>
      <p v-if="error" class="feedback error" role="alert">{{ error }} <el-button text @click="load">{{ t('重试') }}</el-button></p>
      <el-table v-loading="loading" :data="rows" :empty-text="t('暂无符合条件的日志')" stripe>
        <el-table-column :label="t('序号')" width="72" type="index" :index="index => (pageNum - 1) * pageSize + index + 1" />
        <el-table-column :label="t('操作时间')" min-width="170">
          <template #default="{ row }">{{ dateText(row.startTime) }}</template>
        </el-table-column>
        <el-table-column :label="t('用户')" prop="createBy" min-width="130" />
        <el-table-column :label="t('模块')" prop="module" min-width="145" />
        <el-table-column :label="t('状态')" width="104">
          <template #default="{ row }">
            <el-tag :type="String(row.status) === '0' ? 'success' : 'danger'" effect="light">
              {{ String(row.status) === '0' ? t('成功') : t('失败') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('IP 地址')" prop="ip" min-width="130" />
        <el-table-column :label="t('操作')" width="88">
          <template #default="{ row }"><el-button text type="primary" @click="showDetail(row)">{{ t('详情') }}</el-button></template>
        </el-table-column>
      </el-table>
      <Pagination :current-page="pageNum" :page-size="pageSize" :total-count="total"
        @change-current="pageNum = $event" @change-size="changePageSize" />
    </div>
    <el-dialog v-model="detailOpen" :title="t('操作日志详情')" width="min(740px, 92vw)" destroy-on-close>
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item :label="t('操作时间')">{{ dateText(detail.startTime) }}</el-descriptions-item>
        <el-descriptions-item :label="t('状态')">{{ String(detail.status) === '0' ? t('成功') : t('失败') }}</el-descriptions-item>
        <el-descriptions-item :label="t('用户')">{{ detail.createBy || '—' }}</el-descriptions-item>
        <el-descriptions-item :label="t('IP 地址')">{{ detail.ip || '—' }}</el-descriptions-item>
        <el-descriptions-item :label="t('服务')">{{ detail.systemCode || '—' }}</el-descriptions-item>
        <el-descriptions-item :label="t('模块')">{{ detail.module || '—' }}</el-descriptions-item>
        <el-descriptions-item :label="t('方法')">{{ detail.method || '—' }}</el-descriptions-item>
        <el-descriptions-item :label="t('耗时')">{{ detail.processTime == null ? '—' : detail.processTime + 'ms' }}</el-descriptions-item>
        <el-descriptions-item :label="t('请求')" :span="2">{{ detail.httpRequestMethod }} {{ detail.requestUri || '—' }}</el-descriptions-item>
      </el-descriptions>
      <h3 class="json-heading">{{ t('请求参数') }}</h3>
      <pre class="json-block">{{ jsonText(detail?.param) }}</pre>
      <h3 class="json-heading">{{ t('响应数据') }}</h3>
      <pre class="json-block">{{ jsonText(detail?.response) }}</pre>
    </el-dialog>
  </section>
</template>
