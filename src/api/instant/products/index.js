import { requestInstant } from '../../clients/index.js'
import { demoBackend } from '../../demo/index.js'

export function listProducts(data, auth, signal) {
  if (demoBackend) return demoBackend.products(data)
  return requestInstant('POST', '/game/gameListQuery', { auth, data: { ...data, isImageAble: 1 }, signal })
}
