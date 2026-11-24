import axios from 'axios'
import { getApiLanguage, t } from '../../languages/index.js'

export class SessionExpired extends Error {
  constructor() {
    super(t('会话已过期，请重新登录。'))
  }
}

function createClient(baseURL, countryCode) {
  const client = axios.create({ baseURL, timeout: 25_000 })

  return async function request(method, url, { auth, ...config } = {}) {
    const language = import.meta.env.VITE_API_LANGUAGE || getApiLanguage()
    const headers = {
      'Accept-Language': language,
      Lang: language,
      FrontSN: String(Math.floor(Math.random() * 100_000_000)),
    }
    const authenticated = auth && 'accessToken' in auth
    if (auth) {
      const authToken = authenticated ? auth.accessToken : auth.token
      headers.Authorization = auth.tokenType + ' ' + authToken
      if (countryCode) headers.token = authToken
    }
    if (countryCode) headers['Country-Code'] = countryCode

    try {
      const { data } = await client.request({ method, url, headers, ...config })
      if (Number(data?.code) === 10001 && authenticated) throw new SessionExpired()
      if (data?.code !== 0 && data?.code !== '0') {
        throw new Error(data?.msg || data?.message || t('服务返回了无法处理的响应。'))
      }
      return data.data
    } catch (error) {
      if (!axios.isAxiosError(error) || axios.isCancel(error)) throw error
      if (error.response?.status === 401 && authenticated) throw new SessionExpired()
      const body = error.response?.data
      const message = error.response
        ? t('服务请求失败（HTTP {status}）。', { status: error.response.status })
        : t('请求未完成，请检查网络和网关配置。')
      throw new Error(body?.msg || body?.message || message)
    }
  }
}

export const requestMain = createClient(import.meta.env.VITE_MAIN_API_BASE || '/api')
export const requestInstant = createClient(
  import.meta.env.VITE_INSTANT_API_BASE || '/api/instant/api',
  import.meta.env.VITE_INSTANT_COUNTRY_CODE || 'ng',
)
