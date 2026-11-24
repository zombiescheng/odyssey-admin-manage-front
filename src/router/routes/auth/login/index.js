const loginView = () => import('../../../../views/auth/login/LoginView.vue')

export default [
  { path: '/login', name: 'auth.login', component: loginView },
  { path: '/auth/totp-challenge', name: 'auth.login.challenge', component: loginView },
]
