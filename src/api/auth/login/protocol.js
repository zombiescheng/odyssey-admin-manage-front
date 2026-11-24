import { t } from '../../../languages/index.js'
export function credentialFrom(data) {
  if (!data?.access_token || data.openid == null || String(data.openid).trim() === '') {
    throw new Error(t('登录响应缺少用户或会话信息。'))
  }
  return {
    accessToken: data.access_token,
    tokenType: tokenType(data.token_type),
    userId: String(data.openid),
  }
}

export function tokenType(value = 'Bearer') {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function form(fields) {
  const data = new FormData()
  for (const [name, value] of Object.entries(fields)) data.append(name, value)
  return data
}

export async function legacyPassword(value, key, iv) {
  const encoder = new TextEncoder()
  const keyBytes = encoder.encode(key)
  const ivBytes = encoder.encode(iv)
  if (![16, 24, 32].includes(keyBytes.length) || ivBytes.length !== 16) {
    throw new Error(t('请配置与原系统一致的登录加密参数。'))
  }
  if (!globalThis.crypto?.subtle) throw new Error(t('登录需要 HTTPS 或本机开发环境。'))
  const input = encoder.encode(value)
  const padded = new Uint8Array(Math.ceil(input.length / 16) * 16)
  padded.set(input)
  const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, 'AES-CBC', false, ['encrypt'])
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv: ivBytes }, cryptoKey, padded)
  // Web Crypto appends a PKCS#7 block to the aligned input. The legacy endpoint uses zero padding.
  const compatible = new Uint8Array(encrypted, 0, padded.length)
  return btoa(Array.from(compatible, byte => String.fromCharCode(byte)).join(''))
}
