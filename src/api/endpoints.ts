export const endpoints = {
  auth: {
    register: "/register",
    login: "/login",
    logout: "/logout",
    me: "/me",
    forgotPassword: "/password/forgot",
    resetPassword: "/password/reset",
  },
  voyages: {
    list: "/voyages",
    detail: (id: string) => `/voyages/${id}`,
  },
  tarifs: {
    list: "/tarifs",
  },
  billets: {
    list: "/billets",
    create: "/billets",
    detail: (id: string) => `/billets/${id}`,
  },
  portefeuille: {
    get: "/portefeuille",
    mouvements: "/portefeuille/mouvements",
    recharge: "/portefeuille/recharge",
  },
  residents: {
    demandes: "/demandes-residence",
    demandeDetail: (id: string) => `/demandes-residence/${id}`,
  },
  plans: {
    list: "/plans",
  },
  abonnements: {
    souscrire: "/abonnements/souscrire",
  },
  notifications: {
    list: "/notifications",
    detail: (id: string) => `/notifications/${id}`,
  },
};
