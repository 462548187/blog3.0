/*
 * @Author: bucai
 * @Date: 2020-05-02 21:09:11
 * @LastEditors: bucai
 * @LastEditTime: 2020-05-03 18:25:50
 * @Description: 
 */

export const state = () => ({
  LoginOrRegisterDialog: false,
  token: '',
  user: null,
});
export const mutations = {
  SET_LOGIN_OR_REGISTER_DIALOG(state) {
    state.LoginOrRegisterDialog = !state.LoginOrRegisterDialog;
  },
  SET_TOKEN(state, payload) {
    state.token = payload;
  },
  SET_USER(state, payload) {
    state.user = payload;
  }
}
export const actions = {
  // nuxtServerInit，用以初始化数据
  async nuxtServerInit({ commit }, { app, $axios }) {
    // 从cookie中获取token，并且将其中的数据更新到store
    const token = app.$cookies.get('Authorization')
    // 如果存在token
    if (token) {
      // 获取用户信息更新
      // commit用以提交需要更新的数据，并指定更新的方法
      const userinfo = await $axios.get('api/users/info');
      console.log('userinfo', userinfo);
      // userinfo
      commit('SET_TOKEN', token);
      commit('SET_USER', userinfo);
    }
  },
}