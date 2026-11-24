import { requestMain } from '../../clients/index.js'
import { demoBackend } from '../../demo/index.js'

export function listLogs(data, auth, signal) {
  if (demoBackend) return demoBackend.logs(data)
  return requestMain('POST', '/api/ucs/systemLog/page', { auth, data, signal })
}
