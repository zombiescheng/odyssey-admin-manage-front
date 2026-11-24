export const isDemo = import.meta.env.DEV && import.meta.env.MODE === 'demo'
export const demoBackend = isDemo ? (await import('./fixtures.js')).demoBackend : null
