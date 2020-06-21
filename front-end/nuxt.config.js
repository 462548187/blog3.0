module.exports = {
  mode: 'universal',
  /*
  ** Headers of the page
  */
  head: {
    title: '不才的博客',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '这是不才的博客，用于记录生活、学习笔记。专注WEB前端，全面发展，做一个有梦想又憨憨的咸鱼。网站内容不定期更新，欢迎大家关注，共同交流进步。' },
      { hid: 'keywords', name: 'keywords', content: "个人博客,不才,不才的博客,前端,web,javascript,vue,react,nodejs,个人博客,不才 Blog,bucai,bucai Blog,blog" }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },
  /*
  ** Customize the progress-bar color
  */
  loading: { color: '#fafafa' },
  /*
  ** Global CSS
  */
  css: [
    '@/assets/common.scss',
    // { src: "mavon-editor/dist/css/index.css" },
    // { src: "mavon-editor/dist/markdown/github-markdown.min.css" },
  ],
  /*
  ** Plugins to load before mounting the App
  */
  plugins: [
    './plugins/axios.js',
    './plugins/constant.js',
    './plugins/global-components',
    './plugins/filters.js',
    './plugins/utils.js',
    { src: '@/plugins/vue-mavon-editor', ssr: false },
    { src: '@/plugins/file.js', ssr: false },
    { src: '@/plugins/vue-cropper.js', ssr: false },
    { src: './plugins/dom.js', ssr: false },

  ],
  /*
  ** Nuxt.js dev-modules
  */
  buildModules: [
    ['@nuxtjs/vuetify', {
      theme: {
        icons: {
          iconfont: 'mdi',
        },
        themes: {
          light: {
            // primary: "#ffeb3b",
            // secondary: "#ffc107",
            // accent: "#3f51b5",
            // error: "#673ab7",
            // warning: "#9c27b0",
            // info: "#e91e63",
            // success: "#00bcd4"
          },
        },
        // light: true,
        // dark: false
      }
    }]
  ],
  /*
  ** Nuxt.js modules
  */
  modules: [
    // Doc: https://axios.nuxtjs.org/usage
    '@nuxtjs/axios',
    // Doc: https://github.com/nuxt-community/dotenv-module
    '@nuxtjs/dotenv',
    '@nuxtjs/style-resources',
    'cookie-universal-nuxt'
  ],
  styleResources: {
    scss: './assets/variables.scss',
  },
  /*
  ** Axios module configuration
  ** See https://axios.nuxtjs.org/options
  */
  axios: {
    proxy: true,

  },
  proxy: {
    '/api/': { target: 'http://bucai-blog-server:9905/', pathRewrite: { '^/api/': '' } }
  },
  /*
  ** Build configuration
  */
  build: {
    vendor: [
      'vue-cropperjs'
    ],
    /*
    ** You can extend webpack config here
    */
    extend (config, ctx) {
    }
  }
}
