<script setup>
import { useVoerkaI18n } from '@voerkai18n/vue'
import { i18nScope } from '../../../languages/index.js'
import LanguageSwitcher from '../../../components/LanguageSwitcher.vue'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { enableTotp, generateRecoveryCodes, getEnrollment } from '../../../api/auth/login/totp.js'
import { isDemo } from '../../../api/demo/index.js'
import { knownPaths } from '../../../router/pages.js'
import { safeReturnPath } from '../../../router/permissions.js'
import { useSession } from '../../../stores/session.js'

const { t } = useVoerkaI18n(i18nScope)
const session = useSession()
const route = useRoute()
const router = useRouter()
const username = ref('')
const password = ref('')
const code = ref('')
const recovery = ref(false)
const busy = ref(false)
const error = ref('')
const information = ref('')
const enrollment = ref()
const totpEnabled = ref(false)
const recoveryCodes = ref([])
const isChallenge = computed(() => route.name === 'auth.login.challenge' && session.challenge)
const isEnrollment = computed(() => isChallenge.value && session.challenge?.kind === 'enroll')
const destination = computed(() => safeReturnPath(route.query.redirect, knownPaths))

async function run(action) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  session.notice = ''
  try {
    await action()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('请求失败，请重试。')
  } finally {
    busy.value = false
  }
}

async function signIn(account = username.value.trim(), secret = password.value) {
  if (!account || !secret) {
    error.value = t('请输入账号和密码。')
    return
  }
  await run(async () => {
    information.value = ''
    await session.signIn(account, secret)
    if (session.challenge) {
      password.value = ''
      await router.replace({ name: 'auth.login.challenge', query: { redirect: destination.value } })
      if (session.challenge.kind === 'enroll') enrollment.value = await getEnrollment(session.challenge)
    } else {
      password.value = ''
      await router.replace(destination.value)
    }
  })
}

async function validateCode() {
  const value = code.value.trim()
  if (!(recovery.value ? value.length > 0 : /^\d{6}$/.test(value))) {
    error.value = recovery.value ? t('请输入恢复码。') : t('请输入 6 位验证码。')
    return
  }
  await run(async () => {
    if (session.challenge?.kind === 'enroll') {
      await enableTotp(session.challenge, value)
      totpEnabled.value = true
      code.value = ''
      recoveryCodes.value = await generateRecoveryCodes(session.challenge)
    } else {
      await session.verify(value, recovery.value)
      await router.replace(destination.value)
    }
  })
}

async function backToLogin() {
  session.challenge = null
  code.value = ''
  recovery.value = false
  enrollment.value = undefined
  totpEnabled.value = false
  recoveryCodes.value = []
  error.value = ''
  await router.replace({ name: 'auth.login', query: { redirect: destination.value } })
}

function switchVerification() {
  recovery.value = !recovery.value
  code.value = ''
  error.value = ''
}

function reloadEnrollment() {
  return run(async () => {
    if (session.challenge?.kind === 'enroll') enrollment.value = await getEnrollment(session.challenge)
  })
}

function reloadRecoveryCodes() {
  return run(async () => {
    if (session.challenge?.kind === 'enroll') recoveryCodes.value = await generateRecoveryCodes(session.challenge)
  })
}

async function finishEnrollment() {
  await backToLogin()
  information.value = t('已开启双因子认证，请重新登录。')
}
</script>

<template>
  <main class="login-screen">
    <div class="login-band">
      <div class="brand"><span class="brand-symbol" aria-hidden="true">O</span><span>ODYSSEY</span></div>
      <div class="login-identity"><span class="login-rule"></span><p>Odyssey<br>{{ t('管理后台') }}</p></div>
    </div>
    <section class="login-panel" :aria-label="isChallenge ? t('双因子认证') : t('账号登录')">
      <div class="login-form">
        <LanguageSwitcher class="login-language" />
        <h1>{{ isEnrollment ? t('设置双因子认证') : isChallenge ? t('双因子认证') : t('登录') }}</h1>
        <p v-if="error || session.notice" class="feedback error" role="alert">{{ error || session.notice }}</p>
        <p v-if="information" class="feedback" role="status">{{ information }}</p>
        <div v-if="isEnrollment && totpEnabled">
          <p class="muted">{{ t('请妥善保存恢复码。失去认证器访问权限时，可用恢复码登录。') }}</p>
          <ul v-if="recoveryCodes.length" class="recovery-codes">
            <li v-for="recoveryCode in recoveryCodes" :key="recoveryCode"><code>{{ recoveryCode }}</code></li>
          </ul>
          <el-button v-else :loading="busy" @click="reloadRecoveryCodes">{{ t('重试生成恢复码') }}</el-button>
          <el-button v-if="recoveryCodes.length" type="primary" class="submit"
            @click="finishEnrollment">{{ t('我已保存，返回登录') }}</el-button>
        </div>
        <form v-else-if="isChallenge" @submit.prevent="validateCode">
          <template v-if="isEnrollment">
            <p class="muted">{{ t('在认证器中添加账号，然后输入生成的验证码。') }}</p>
            <div v-if="enrollment" class="enrollment">
              <img v-if="enrollment.qrCodeImage" :src="'data:image/png;base64,' + enrollment.qrCodeImage" :alt="t('认证器二维码')">
              <code v-if="enrollment.manualEntryKey">{{ enrollment.manualEntryKey }}</code>
            </div>
            <el-button v-else @click="reloadEnrollment" :disabled="busy">{{ t('重新加载绑定信息') }}</el-button>
          </template>
          <label for="verification-code">{{ recovery ? t('恢复码') : t('6 位验证码') }}</label>
          <el-input id="verification-code" v-model="code" autocomplete="one-time-code"
            :inputmode="recovery ? 'text' : 'numeric'" :maxlength="recovery ? 128 : 6" size="large" />
          <p v-if="isDemo" class="muted">{{ t('演示验证码为 123456，恢复码为 DEMO-2026。') }}</p>
          <el-button native-type="submit" type="primary" size="large" :loading="busy" class="submit"
            :disabled="Boolean(isEnrollment && !enrollment)">{{ isEnrollment ? t('确认启用') : t('验证') }}</el-button>
          <div class="auth-links">
            <el-button text :disabled="busy" @click="backToLogin">{{ t('返回登录') }}</el-button>
            <el-button v-if="!isEnrollment" text :disabled="busy" @click="switchVerification">
              {{ recovery ? t('使用验证码') : t('使用恢复码') }}
            </el-button>
          </div>
        </form>
        <form v-else @submit.prevent="signIn()">
          <label for="account">{{ t('账号') }}</label>
          <el-input id="account" v-model="username" autocomplete="username" size="large" />
          <label for="password">{{ t('密码') }}</label>
          <el-input id="password" v-model="password" type="password" autocomplete="current-password" show-password size="large" />
          <el-button native-type="submit" type="primary" size="large" :loading="busy" class="submit">{{ t('登录') }}</el-button>
        </form>
        <div v-if="isDemo && !isChallenge" class="demo-signin">
          <p>{{ t('本地演示') }}</p>
          <div class="auth-links">
            <el-button :disabled="busy" @click="signIn('demo-admin', 'demo')">{{ t('管理员') }}</el-button>
            <el-button :disabled="busy" @click="signIn('demo-auditor', 'demo')">{{ t('审计员') }}</el-button>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
