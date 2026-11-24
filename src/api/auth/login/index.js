import { t } from '../../../languages/index.js'
import { requestMain } from '../../clients/index.js'
import { demoBackend } from '../../demo/index.js'
import { credentialFrom, form, legacyPassword, tokenType } from './protocol.js'

export async function login(username, password) {
  if (demoBackend) return demoBackend.login(username, password)
  const encoded = await legacyPassword(
    password, import.meta.env.VITE_LEGACY_LOGIN_KEY || '', import.meta.env.VITE_LEGACY_LOGIN_IV || '',
  )
  const data = await requestMain('POST', '/open/oauth/token', {
    data: form({ username, password: encoded, dynamicCode: '', dynamicCodeType: '0' }),
  })
  if (String(data?.totpEnabled) === '1' || String(data?.needTotp) === '1') {
    if (!data.temp_token) throw new Error(t('服务器未返回双因子验证会话。'))
    return {
      kind: String(data.totpEnabled) === '1' ? 'verify' : 'enroll',
      token: data.temp_token,
      tokenType: tokenType(data.token_type),
    }
  }
  return { kind: 'authenticated', credential: credentialFrom(data) }
}

export async function loadWorkspace(auth) {
  if (demoBackend) return demoBackend.workspace(auth)
  const [profile, resources] = await Promise.all([
    requestMain('GET', '/api/ucs/user/profile', { auth }),
    requestMain('POST', '/api/ucs/userRole/getUserResources', { auth, data: { userId: auth.userId } }),
  ])
  if (!profile || !Array.isArray(resources)) throw new Error(t('服务器未返回有效的账号权限。'))
  return {
    userName: profile.nickName || profile.userName || profile.username || profile.name || auth.userId,
    resources,
  }
}

export async function logout(auth) {
  if (demoBackend) return demoBackend.logout(auth)
  await requestMain('GET', '/open/identity/logout', { auth, params: { access_token: auth.accessToken } })
}
