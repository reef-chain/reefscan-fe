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
                name="tokenImage"
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
              >{{ buttonMessage }}
            </b-button>
          </b-form>
        </div>
      </b-container>
    </section>
  </div>
</template>

<script>
import crypto from 'crypto'
import { validationMixin } from 'vuelidate'
// eslint-disable-next-line no-unused-vars
import { WsProvider } from '@polkadot/api'
import { Provider, Signer } from '@reef-defi/evm-provider'
import {
  web3Accounts,
  web3Enable,
  web3FromAddress,
} from '@polkadot/extension-dapp'
import { encodeAddress } from '@polkadot/keyring'
import commonMixin from '@/mixins/commonMixin.js'
import { network } from '@/frontend.config.js'

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64Data = reader.result.split(',')[1]
      resolve(base64Data)
    }
    reader.onerror = (error) => {
      reject(error)
    }
    reader.readAsDataURL(file)
  })
}

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
      isRawSigned: false,
      buttonMessage: 'Upload and Sign',
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
      // const fileData = await readFileAsArrayBuffer(this.$file)
      this.$fileBase64 = await readFileAsBase64(this.$file)
      this.$fileData = {
        fileBase64: this.$fileBase64,
        timestamp: new Date().getTime(),
      }
      const hash = generateSHA256Hash(JSON.stringify(this.$fileData))
      this.$fileHash = hash
    },
    async onSubmit(evt) {
      evt.preventDefault()
      const allInjected = await web3Enable('Reef')
      if (allInjected.length === 0) {
        throw new Error('extension not installed')
      }
      const evmProvider = new Provider({
        provider: new WsProvider(network.nodeWs),
      })
      evmProvider.api.on('ready', async () => {
        const allAccounts = await web3Accounts()
        const injector = await web3FromAddress(this.selectedAddress)
        const wallet = new Signer(
          evmProvider,
          this.selectedAddress,
          injector.signer
        )
        // const stringifiedData = [this.$fileHash].toString()
        if (!this.$isRawSigned) {
          try {
            this.$signature = await wallet.signingKey.signRaw({
              address: allAccounts[0].address,
              data: this.$fileHash,
              type: 'bytes',
            })
            this.$isRawSigned = true
            this.$bvToast.toast(`Successfully signed the file data`, {
              title: 'Signed Raw',
              variant: 'success',
              autoHideDelay: 3000,
              appendToast: false,
            })
            this.buttonMessage = 'Upload icon'
          } catch (error) {
            this.$bvToast.toast(`Unable to sign the file data`, {
              title: 'Error in signing message',
              variant: 'danger',
              autoHideDelay: 3000,
              appendToast: false,
            })
          }
        }
      })
      const ensure = (condition, message) => {
        if (!condition) {
          throw new Error(message)
        }
      }
      try {
        // generate recaptcha token
        await this.$recaptcha.getResponse()
        ensure(this.$file != null, 'Please upload a file')
        // this.selectedAddress = await resolveEvmAddress(this.$selectedAddress)
        if (this.$signature) {
          const body = {
            signature: this.$signature.signature,
            fileHash: this.$fileHash,
            fileData: this.$fileData,
            contractAddress: this.$route.params.id,
            signerAddress: this.selectedAddress,
          }
          const response = await this.$axios.post(network.uploadTokenApi, body)
          this.$bvToast.toast(response.data, {
            title: 'Success',
            variant: 'success',
            autoHideDelay: 3000,
            appendToast: false,
          })
          await this.$recaptcha.reset()
          this.requestStatus = 'Verified'
          this.$bvToast.toast(`Uploaded Token icon successfully`, {
            title: 'Success',
            variant: 'success',
            autoHideDelay: 3000,
            appendToast: false,
          })
          setTimeout(() => {
            this.$router.push(`/token/${this.$route.params.id}`)
          }, 2000)
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
        if (this.requestStatus !== undefined) {
          this.$bvToast.toast(`${this.requestStatus}`, {
            title: 'Error in updating token icon!',
            variant: 'danger',
            autoHideDelay: 3000,
            appendToast: false,
          })
        }
      }
    },
  },
}

function generateSHA256Hash(inputString) {
  const hash = crypto.createHash('sha256')
  hash.update(inputString)
  return hash.digest('hex')
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
