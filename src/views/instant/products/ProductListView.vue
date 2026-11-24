<script setup>
import { useVoerkaI18n } from '@voerkai18n/vue'
import { i18nScope } from '../../../languages/index.js'
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { SessionExpired } from '../../../api/clients/index.js'
import { listProducts } from '../../../api/instant/products/index.js'
import Pagination from '../../../components/Pagination.vue'
import { useSession } from '../../../stores/session.js'

defineOptions({ name: 'ProductListView' })

const gameCode = ref('')
const status = ref()
const { t } = useVoerkaI18n(i18nScope)
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
    const result = await listProducts(query, credential, controller.signal)
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
  appliedFilters.value = { gameCode: gameCode.value.trim() || null, status: status.value ?? null }
}

function changePageSize(size) {
  pageSize.value = size
  pageNum.value = 1
}

watch([appliedFilters, pageNum, pageSize], load)
onBeforeUnmount(() => pending?.abort())
const amountFormat = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const countFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

function format(value, formatter) {
  if (value == null || value === '') return '—'
  const number = Number(value)
  return Number.isFinite(number) ? formatter.format(number) : String(value)
}
function reset() {
  gameCode.value = ''
  status.value = undefined
  return search()
}
onMounted(search)
</script>

<template>
  <section>
    <header class="page-heading"><h1>{{ t('产品管理') }}</h1></header>
    <div class="panel">
      <form class="filters" @submit.prevent="search">
        <label>
          <span>{{ t('产品编号') }}</span>
          <el-input v-model="gameCode" :placeholder="t('输入产品编号')" clearable />
        </label>
        <label>
          <span>{{ t('产品状态') }}</span>
          <el-select v-model="status" :placeholder="t('全部状态')" clearable>
            <el-option :label="t('启用')" :value="0" />
            <el-option :label="t('停用')" :value="1" />
          </el-select>
        </label>
        <div class="filter-actions">
          <el-button native-type="submit" type="primary" :loading="loading">{{ t('查询') }}</el-button>
          <el-button @click="reset">{{ t('重置') }}</el-button>
        </div>
      </form>
      <p v-if="error" class="feedback error" role="alert">{{ error }} <el-button text @click="load">{{ t('重试') }}</el-button></p>
      <el-table v-loading="loading" :data="rows" :empty-text="t('暂无符合条件的产品')" stripe>
        <el-table-column :label="t('产品编号')" prop="gameCode" min-width="116" />
        <el-table-column :label="t('产品名称')" prop="gameName" min-width="150" />
        <el-table-column :label="t('票价')" min-width="92" align="right">
          <template #default="{ row }">{{ format(row.unitPrice, amountFormat) }}</template>
        </el-table-column>
        <el-table-column :label="t('已加载')" min-width="92" align="right">
          <template #default="{ row }">{{ format(row.settled, countFormat) }}</template>
        </el-table-column>
        <el-table-column :label="t('已激活')" min-width="92" align="right">
          <template #default="{ row }">{{ format(row.issued, countFormat) }}</template>
        </el-table-column>
        <el-table-column :label="t('未激活')" min-width="92" align="right">
          <template #default="{ row }">{{ format(row.available, countFormat) }}</template>
        </el-table-column>
        <el-table-column :label="t('金额')" min-width="104" align="right">
          <template #default="{ row }">{{ format(row.totalPrices ?? 0, amountFormat) }}</template>
        </el-table-column>
        <el-table-column :label="t('状态')" width="106" align="center">
          <template #default="{ row }">
            <el-tag :type="String(row.status) === '0' ? 'success' : 'info'" effect="light">
              {{ String(row.status) === '0' ? t('启用') : t('停用') }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <Pagination :current-page="pageNum" :page-size="pageSize" :total-count="total"
        @change-current="pageNum = $event" @change-size="changePageSize" />
    </div>
  </section>
</template>
