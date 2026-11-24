import { t } from '../../../languages/index.js'
import { requestMain } from '../../clients/index.js'
import { demoBackend } from '../../demo/index.js'
import { credentialFrom, form } from './protocol.js'

export async function verifyTotp(challenge, code, recovery) {
  if (demoBackend) return demoBackend.verify(challenge, code, recovery)
  const data = await requestMain('POST', '/open/oauth/totp/verify', {
    auth: challenge,
    data: form({ totpCode: code, tempToken: challenge.token, type: recovery ? '2' : '1' }),
  })
  return credentialFrom(data)
}

export function getEnrollment(challenge) {
  if (demoBackend) return demoBackend.enrollment(challenge)
  return requestMain('GET', '/api/system/totp/setup/init', { auth: challenge })
}

export async function enableTotp(challenge, code) {
  if (demoBackend) return demoBackend.enableTotp(challenge, code)
  await requestMain('POST', '/api/system/totp/setup/enable', { auth: challenge, data: { totpCode: code } })
}

export async function generateRecoveryCodes(challenge) {
  if (demoBackend) return demoBackend.recoveryCodes(challenge)
  const data = await requestMain('POST', '/api/system/totp/recovery-codes/generate', { auth: challenge, data: {} })
  if (!Array.isArray(data?.recoveryCodes) || !data.recoveryCodes.length) {
    throw new Error(t('未收到恢复码，请重试。'))
  }
  return data.recoveryCodes
}
