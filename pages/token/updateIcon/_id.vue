<template>
  <div class="verify-contract">
    <section>
      <b-container class="page-verify-contract main py-5">
        <div class="verify-contract__head">
          <Headline class="verify-contract__headline">
            {{ 'Upload Token Icon' }}
          </Headline>
          <Tabs v-model="tab" :options="$options.tabs" />
        </div>
        <div v-if="tab === 'verify'" class="verify-contract">
          <b-alert show>
            Only you have
            <strong>access</strong> over this page. Kindly choose an image file
            to upload.
          </b-alert>
          <b-form enctype="multipart/form-data" @submit="onSubmit">
            <div class="d-flex justify-content-center">
              <b-form-file
                accept="image/*"
                class="text-center radius-0"
                placeholder="Please select image icon file..."
                drop-placeholder="Drop image icon file here..."
                aria-describedby="source-help"
                @change="(event) => onFileChange(event)"
              />
            </div>
            <br />
            <recaptcha />
            <b-alert
              v-if="requestStatus === 'Verified'"
              variant="success"
              class="text-center"
              show
            >
              {{ requestStatus }}
            </b-alert>
            <b-alert
              v-if="requestStatus && requestStatus !== 'Verified'"
              variant="danger"
              class="text-center"
              show
            >
              {{ requestStatus }}
            </b-alert>
            <b-button type="submit" variant="outline-primary2" class="btn-block"
              >Upload Icon
            </b-button>
          </b-form>
        </div>
      </b-container>
    </section>
  </div>
</template>

<script>
import { validationMixin } from 'vuelidate'
// eslint-disable-next-line no-unused-vars
import { Provider, Signer } from '@reef-defi/evm-provider'
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp'
import { encodeAddress } from '@polkadot/keyring'
import { WsProvider } from '@polkadot/rpc-provider'
import commonMixin from '@/mixins/commonMixin.js'
import { network } from '@/frontend.config.js'

export default {
  mixins: [commonMixin, validationMixin],
  tabs: {},
  data() {
    return {
      tab: 'verify',
      requestStatus: null,
      requestId: null,
      requestIds: [],
      requests: [],
      source: [{ filename: '', content: null }],
      sourceContent: null,
      uploadPercentage: 0,
      compilerVersion: null,
      args: '',
      nightly: true,
      optimization: true,
      runs: 200,
      file: null,
      fileName: null,
      fileHash: null,
      signer: null,
      extensionAccounts: null,
      noAccountsFound: true,
      extensionAddresses: [],
      selectedAddress: null,
      selectedEvmAddress: null,
      selectedAccount: null,
      signature: null,
    }
  },
  async created() {
    await web3Enable('Reefscan')
    const accounts = await web3Accounts()
    if (accounts.length > 0) {
      this.extensionAccounts = accounts
      if (this.extensionAccounts.length > 0) {
        this.selectedAccount = this.extensionAccounts[0]
        this.selectedAddress = encodeAddress(
          this.extensionAccounts[0].address,
          network.ss58Format
        )
      } else {
        this.noAccountsFound = true
      }
    }
  },
  methods: {
    validateState(name) {
      const { $dirty, $error } = this.$v[name]
      return $dirty ? !$error : null
    },
    async onFileChange(event) {
      this.$file = event.target.files[0]
      const fileData = await readFileAsArrayBuffer(this.$file)
      const hash = await generateSHA256Hash(fileData)
      this.$fileName = this.$file.name
      this.$fileHash = hash
    },
    async onSubmit(evt) {
      evt.preventDefault()
      const allInjected = await web3Enable('reef')
      const injectedSigner = allInjected[0].signer
      const evmProvider = new Provider({
        provider: new WsProvider(network.nodeWs),
      })
      try {
        evmProvider.api.on('ready', async () => {
          this.$signer = new Signer(
            evmProvider,
            this.selectedAddress,
            injectedSigner
          )
          const signMsg = {
            contractAddress: this.$route.params.id,
            fileHash: this.$fileHash,
          }
          this.$signature = await this.$signer.signMessage(signMsg)
        })
      } catch (error) {
        this.requestStatus = error
      }

      const ensure = (condition, message) => {
        if (!condition) {
          throw new Error(message)
        }
      }
      try {
        // generate recaptcha token
        await this.$recaptcha.getResponse()
        ensure(this.$file != null, 'Please upload a file')
        if (this.$signature) {
          const body = {
            signature: this.$signature,
            file: this.$file,
          }
          await this.$axios.post(network.verificatorApi, body)
          await this.$recaptcha.reset()
          this.requestStatus = 'Verified'
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        if (error.response) {
          this.requestStatus = error.response.data.message
        } else if (error.message) {
          this.requestStatus = error.message
        } else {
          this.requestStatus = 'Recaptcha token is missing'
        }
      }
    },
  },
}
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

function generateSHA256Hash(data) {
  const buffer = new Uint8Array(data)
  return crypto.subtle.digest('SHA-256', buffer).then((hashBuffer) => {
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    return hashHex
  })
}
</script>

<style lang="scss">
.verify-contract {
  .verify-contract__head {
    width: 100%;
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .verify-contract__headline {
      justify-content: flex-start;
      text-align: left;
    }

    .tabs {
      margin-top: 0;
    }

    @media only screen and (max-width: 991px) {
      flex-flow: column nowrap;
      justify-content: flex-start;

      .verify-contract__headline {
        justify-content: center;
        text-align: center;
      }

      .tabs {
        margin-top: 15px;
      }
    }
  }

  .alert {
    margin-bottom: 25px;
  }
  .input-height {
    height: 45px !important;
  }
  .content-source-filename {
    border-bottom-left-radius: 0% !important;
    border-bottom-right-radius: 0% !important;
    border-bottom: solid 1px !important;
    border-color: #ccc !important;
  }
  .content-source {
    border-top-left-radius: 0% !important;
    border-top-right-radius: 0% !important;
  }

  .empty-source-btn {
    border-bottom-left-radius: 8px !important;
    border-bottom-right-radius: 8px !important;
  }

  .radius-0 {
    border-radius: 0% !important;
  }

  .btn {
    margin-top: 5px;
    border: none;
    padding: 10px 21px;
    font-size: 15px;
    border-radius: 99px;
    background: linear-gradient(90deg, #a93185, #5531a9);
    transition: filter 0.15s;
    color: white;

    &:hover {
      filter: brightness(1.2);
    }

    &:active {
      filter: brightness(1.4);
    }
  }
}
</style>
