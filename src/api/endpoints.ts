export const endpoints = {
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    me: "/auth/me",
  },
  users: {
    list: "/users",
    detail: (id: string) => `/users/${id}`,
  },
};
