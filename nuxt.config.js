import { network } from './frontend.config.js'

export default {
  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,
  router: {
    middleware: 'network',
  },

  // Target: https://go.nuxtjs.dev/config-target
  target: 'static',

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'Explorer | Reef chain',
    htmlAttrs: {
      lang: 'en',
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: 'Reef Chain is an EVM compatible chain for DeFi',
      },
    ],
    link: [{ rel: 'icon', type: 'image/png', href: '/img/favicon.png' }],
  },

  // Global CSS (https://go.nuxtjs.dev/config-css)
  css: [network.theme, 'vue-json-pretty/lib/styles.css'],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    '@/plugins/vue-json-pretty',
    '@/plugins/Table',
    '@/plugins/Details',
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/eslint
    '@nuxtjs/eslint-module',
    // https://go.nuxtjs.dev/stylelint
    '@nuxtjs/stylelint-module',
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/bootstrap
    'bootstrap-vue/nuxt',
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    // https://i18n.nuxtjs.org
    'nuxt-i18n',
    // https://github.com/nuxt-community/fontawesome-module
    '@nuxtjs/fontawesome',
    // https://www.npmjs.com/package/nuxt-clipboard2
    'nuxt-clipboard2',
    // https://www.npmjs.com/package/cookie-universal-nuxt
    ['cookie-universal-nuxt', { alias: 'cookies' }],
    // https://github.com/nuxt-community/recaptcha-module
    '@nuxtjs/recaptcha',
  ],

  // Module configurations
  axios: {},

  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    vueI18n: {
      fallbackLocale: 'en',
      messages: {
        en: require('./locales/en.json'),
        es: require('./locales/es.json'),
      },
    },
  },
  bootstrapVue: {
    bootstrapCSS: false,
    bootstrapVueCSS: false,
  },
  fontawesome: {
    icons: {
      solid: true,
      regular: true,
    },
  },
  recaptcha: {
    hideBadge: true, // Hide badge element (v3 & v2 via size=invisible)
    language: 'en', // Recaptcha language (v2)
    siteKey: '6LfNcPIaAAAAAJgyccwkRP0gmSzmsw0opCuQg76l', // Site key for requests
    version: 2, // Version
    size: 'compact', // Size: 'compact', 'normal', 'invisible' (v2)
  },

  // Build Configuration (https://go.nuxtjs.dev/config-build)
  build: {
    extend(config) {
      const commonNodeModulesPatterns = [
        /node_modules\/@ethereumjs\/util\/dist\/provider\.js/,
        /node_modules\/@ethereumjs\/util\/dist\/bytes\.js/,
        /node_modules\/@ethereumjs\/util\/dist\/asyncEventEmitter\.js/,
        /node_modules\/micro-ftch\/index\.js/,
        /node_modules\/@noble\/curves\/abstract\/weierstrass\.js/,
        /node_modules\/@polkadot\/types-codec\/base\/Tuple\.js/,
        /node_modules\/@polkadot\/keyring\/node_modules\/@polkadot\/util-crypto\/sr25519\/vrfSign\.js/,
        /node_modules\/@polkadot\/types\/metadata\/v14\/toV15\.js/,
        /node_modules\/@polkadot\/keyring\/pairs\.js/,
        /node_modules\/@polkadot\/types-create\/create\/type\.js/,
        /node_modules\/@polkadot\/types-codec\/base\/Vec\.js/,
        /node_modules\/@polkadot\/types-codec\/extended\/BTreeSet\.js/,
        /node_modules\/@polkadot\/x-textdecoder\/cjs\/fallback\.js/,
        /node_modules\/@polkadot\/types-codec\/extended\/BitVec\.js/,
        /node_modules\/@polkadot\/types\/generic\/Event\.js/,
        /node_modules\/@polkadot\/types-codec\/abstract\/Int\.js/,
        /node_modules\/@polkadot\/types\/generic\/ConsensusEngineId\.js/,
        /node_modules\/@polkadot\/types-codec\/native\/Set\.js/,
        /node_modules\/@polkadot\/types-codec\/abstract\/Base\.js/,
        /node_modules\/@polkadot\/types-codec\/native\/Struct\.js/,
        /node_modules\/@polkadot\/types-codec\/extended\/Map\.js/,
        /node_modules\/@polkadot\/types-codec\/base\/DoNotConstruct\.js/,
        /node_modules\/@polkadot\/keyring\/node_modules\/@polkadot\/util-crypto\/key\/DeriveJunction\.js/,
        /node_modules\/@polkadot\/types\/node_modules\/@polkadot\/util-crypto\/key\/DeriveJunction\.js/,
        /node_modules\/@polkadot\/util\/format\/formatBalance\.js/,
        /node_modules\/@polkadot\/util\/versionDetect\.js/,
        /node_modules\/@polkadot\/util\/logger\.js/,
        /node_modules\/@polkadot\/types-codec\/base\/Null\.js/,
        /node_modules\/@polkadot\/keyring\/node_modules\/@polkadot\/util-crypto\/sr25519\/sign\.js/,
        /node_modules\/@polkadot\/types\/node_modules\/@polkadot\/util-crypto\/sr25519\/sign\.js/,
        /node_modules\/@polkadot\/types-codec\/extended\/Range\.js/,
        /node_modules\/@polkadot\/types\/generic\/Call\.js/,
        /node_modules\/@polkadot\/keyring\/testing\.js/,
        /node_modules\/@polkadot\/types-codec\/native\/Bool\.js/,
        /node_modules\/@polkadot\/types-codec\/primitive\/I128\.js/,
        /node_modules\/@polkadot\/types-codec\/primitive\/I16\.js/,
        /node_modules\/@polkadot\/types-codec\/primitive\/I256\.js/,
        /node_modules\/@polkadot\/types-codec\/primitive\/I32\.js/,
        /node_modules\/@polkadot\/types-codec\/primitive\/I64\.js/,
        /node_modules\/@polkadot\/types-codec\/primitive\/I8\.js/,
        /node_modules\/@polkadot\/types-codec\/primitive\/U128\.js/,
        /node_modules\/@polkadot\/types-codec\/primitive\/U16\.js/,
        /node_modules\/@polkadot\/types-codec\/primitive\/U256\.js/,
        /node_modules\/@polkadot\/types-codec\/primitive\/U32\.js/,
        /node_modules\/@polkadot\/types-codec\/primitive\/U64\.js/,
        /node_modules\/@polkadot\/types-codec\/primitive\/U8\.js/,
        /node_modules\/@polkadot\/types-codec\/primitive\/F32\.js/,
        /node_modules\/@polkadot\/types-codec\/primitive\/F64\.js/,
        /node_modules\/@polkadot\/types\/node_modules\/@polkadot\/util-crypto\/sr25519\/vrfSign\.js/,
        /node_modules\/@polkadot\/types\/interfaces\/alias\.js/,
        /node_modules\/@polkadot\/keyring\/node_modules\/@polkadot\/wasm-bridge\/wbg\.js/,
        /node_modules\/@polkadot\/types\/node_modules\/@polkadot\/wasm-bridge\/wbg\.js/,
        /node_modules\/@polkadot\/types\/create\/registry\.js/,
        /node_modules\/@polkadot\/types-codec\/abstract\/Array\.js/,
        /node_modules\/@polkadot\/types-codec\/native\/Float\.js/,
        /node_modules\/@polkadot\/types\/node_modules\/@polkadot\/util-crypto\/secp256k1\/sign\.js/,
        /node_modules\/@polkadot\/keyring\/node_modules\/@polkadot\/util-crypto\/secp256k1\/sign\.js/,
        /node_modules\/@polkadot\/types-codec\/base\/VecFixed\.js/,
        /node_modules\/@polkadot\/types\/extrinsic\/v4\/ExtrinsicPayload\.js/,
        /node_modules\/@polkadot\/types\/primitive\/StorageKey\.js/,
        /node_modules\/@polkadot\/types-codec\/base\/Enum\.js/,
        /node_modules\/@polkadot\/types-codec\/native\/Raw\.js/,
        /node_modules\/@polkadot\/keyring\/node_modules\/@polkadot\/wasm-bridge\/bridge\.js/,
        /node_modules\/@polkadot\/types\/node_modules\/@polkadot\/wasm-bridge\/bridge\.js/,
        /node_modules\/@polkadot\/types\/extrinsic\/v4\/ExtrinsicSignature\.js/,
        /node_modules\/@polkadot\/types-codec\/native\/Json\.js/,
        /node_modules\/@polkadot\/keyring\/node_modules\/@polkadot\/wasm-bridge\/init\.js/,
        /node_modules\/@polkadot\/types\/node_modules\/@polkadot\/wasm-bridge\/init\.js/,
        /node_modules\/@polkadot\/types\/extrinsic\/Extrinsic\.js/,
        /node_modules\/@polkadot\/keyring\/node_modules\/@polkadot\/networks\/interfaces\.js/,
        /node_modules\/@polkadot\/types\/node_modules\/@polkadot\/networks\/interfaces\.js/,
        /node_modules\/@polkadot\/types\/metadata\/MetadataVersioned\.js/,
        /node_modules\/@polkadot\/util\/format\/formatElapsed\.js/,
        /node_modules\/@polkadot\/types\/extrinsic\/SignerPayload\.js/,
        /node_modules\/@polkadot\/types-codec\/extended\/WrapperKeepOpaque\.js/,
        /node_modules\/@polkadot\/util\/memoize\.js/,
        /node_modules\/@polkadot\/types-codec\/native\/Date\.js/,
        /node_modules\/@polkadot\/types-codec\/base\/Compact\.js/,
        /node_modules\/@polkadot\/keyring\/keyring\.js/,
        /node_modules\/@polkadot\/types\/metadata\/PortableRegistry\/PortableRegistry\.js/,
        /node_modules\/@polkadot\/types-codec\/native\/Text\.js/,
        /node_modules\/@polkadot\/util\/u8a\/toHex\.js/,
        /node_modules\/@polkadot\/types\/generic\/Vote\.js/,
        /node_modules\/@polkadot\/types\/metadata\/decorate\/storage\/util\.js/,
        /node_modules\/@polkadot\/types\/node_modules\/@polkadot\/util-crypto\/mnemonic\/bip39\.js/,
        /node_modules\/@polkadot\/keyring\/node_modules\/@polkadot\/util-crypto\/mnemonic\/bip39\.js/,
        /node_modules\/@polkadot\/types-codec\/base\/Option\.js/,
      ]
      if (config.resolve.extensions) {
        config.resolve.extensions.push('.mjs')
      } else {
        config.resolve.extensions = ['.mjs']
      }
      config.module.rules.push(
        {
          test: /\.mjs$/,
          include: /node_modules/,
          exclude: /node_modules\/@reef-chain\/util-lib\/dist\/util-lib\.mjs/,
          type: 'javascript/auto',
        },
        {
          test: /\.js$/,
          exclude: (filePath) => {
            return commonNodeModulesPatterns.some((pattern) =>
              pattern.test(filePath)
            )
          },
          loader: require.resolve('@open-wc/webpack-import-meta-loader'),
        },
        {
          test: /node_modules\/@reef-chain\/util-lib\/dist\/util-lib\.mjs/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env'],
                plugins: ['@babel/plugin-proposal-optional-chaining'],
                sourceMaps: false,
                retainLines: false,
                minified: true,
              },
            },
            {
              loader: require.resolve('@open-wc/webpack-import-meta-loader'),
            },
          ],
        },
        {
          include: (filePath) => {
            return commonNodeModulesPatterns.some((pattern) =>
              pattern.test(filePath)
            )
          },
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
              plugins: ['@babel/plugin-proposal-optional-chaining'],
            },
          },
        }
      )
      // https://github.com/nuxt/nuxt.js/issues/1142
      config.resolve.alias.vue = 'vue/dist/vue.common'

      // https://stackoverflow.com/questions/57161839/module-not-found-error-cant-resolve-fs-in
      config.node = {
        fs: 'empty',
      }
    },
  },

  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: ['style-loader', 'css-loader', 'sass-loader'],
        loader: 'vue-svg-loader',
      },
    ],
  },
}
