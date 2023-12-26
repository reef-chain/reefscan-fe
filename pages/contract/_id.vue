<template>
  <div>
    <section>
      <b-container class="contract-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <NotFound v-else-if="!contract" text="Contract not found" />
        <Card v-else class="contract-details">
          <div class="contract-details__identicon">
            <eth-identicon v-if="!iconUrl" :address="address" :size="80" />
            <img
              v-if="iconUrl"
              :src="iconUrl"
              style="width: 80px; height: 80px"
            />
          </div>

          <Headline>{{
            verified ? verified.name : '' || shortHash(address)
          }}</Headline>

          <h4 class="text-center mb-4">
            <p class="mt-3">
              <b-badge
                v-if="verified && verified.type !== 'other'"
                :to="`/token/${contract.address}`"
                class="ml-2"
                variant="info"
              >
                {{ verified.type.replace('ERC', 'ERC-') }}
              </b-badge>
              <b-badge v-if="verified" class="ml-2" variant="success">
                Verified source
                <font-awesome-icon icon="check" />
              </b-badge>
            </p>
            <div v-if="!verified" class="unverified-section">
              <div class="unverified-badge">
                <div class="unverified-badge__content">
                  <div class="unverified-badge__text">
                    Contract's source code has not yet been published by it's
                    creator.
                  </div>
                </div>
              </div>

              <nuxt-link
                to="/verifyContract"
                class="unverified-section__verify-btn"
              >
                Submit source
              </nuxt-link>
            </div>
          </h4>

          <Tabs v-model="tab" :options="tabs" />

          <!-- General -->

          <Data v-if="tab === 'general'">
            <Row>
              <Cell>Contract address</Cell>
              <Cell>
                <eth-identicon :address="address" :size="20" />
                <span>{{ address }}</span>
              </Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.contract.verified') }}</Cell>
              <Cell>
                <font-awesome-icon
                  :icon="verified ? 'check' : 'times'"
                  :class="verified ? 'text-success' : 'text-danger'"
                />
              </Cell>
            </Row>

            <Row v-if="tokenData">
              <Cell>Token</Cell>
              <Cell>
                <div class="token__identicon">
                  <eth-identicon
                    v-if="!iconUrl"
                    :address="address"
                    :size="16"
                  />
                  <nuxt-link :to="`/token/${tokenData.address}`">
                    <img
                      v-if="iconUrl"
                      :src="iconUrl"
                      style="width: 16px; height: 16px"
                    />
                  </nuxt-link>
                </div>
                <nuxt-link :to="`/token/${tokenData.address}`">
                  {{ tokenData.fullName }}
                </nuxt-link>
              </Cell>
            </Row>

            <Row>
              <Cell>Created at block</Cell>
              <Cell>
                <nuxt-link
                  :to="`/block?blockNumber=${contract.extrinsic.block_id}`"
                >
                  # {{ formatNumber(contract.extrinsic.block_id) }}
                </nuxt-link>
              </Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.contract.signer') }}</Cell>
              <Cell>
                <ReefIdenticon
                  v-if="contract.signerId"
                  :key="contract.signerId"
                  class="contract-details__account-identicon"
                  :address="contract.signerId"
                  :size="20"
                />
                <nuxt-link
                  v-if="contract.signerId"
                  :to="`/account/${contract.signerId}`"
                >
                  {{ shortAddress(contract.signerId) }}
                </nuxt-link>
              </Cell>
            </Row>
            <Row>
              <Cell>Status</Cell>
              <Cell>
                <font-awesome-icon
                  v-if="contract.statusResponse == 'success'"
                  icon="check"
                  class="text-success"
                />
                <font-awesome-icon v-else icon="times" class="text-danger" />
              </Cell>
            </Row>
            <Row>
              <Cell>Contract balance</Cell>
              <Cell>
                <span>{{ formatAmount(balance) }}</span>
              </Cell>
            </Row>
            <!--TODO Ziga
            <Row v-if="contract.value">
              <Cell>{{ $t('details.contract.value') }}</Cell>
              <Cell>{{ contract.value }}</Cell>
            </Row>-->
            <!--TODO Ziga
            <Row v-if="contract.gas_limit">
              <Cell>{{ $t('details.contract.gas_limit') }}</Cell>
              <Cell>{{ contract.gas_limit }}</Cell>
            </Row>-->
            <!--TODO Ziga
            <Row v-if="contract.storage_limit">
              <Cell>{{ $t('details.contract.storage_limit') }}</Cell>
              <Cell>{{ contract.storage_limit }}</Cell>
            </Row>-->

            <!-- <Row v-if="contract.bytecode">
              <Cell>{{ $t('details.contract.bytecode') }}</Cell>
              <Cell wrap>{{ contract.bytecode }}</Cell>
            </Row> -->

            <Row v-if="contract.metadata">
              <Cell>{{ $t('details.contract.metadata') }}</Cell>
              <Cell wrap>{{ contract.metadata }}</Cell>
            </Row>

            <Row v-if="decodedMetadata">
              <Cell>{{ $t('details.contract.decoded_metadata') }}</Cell>
              <Cell class="table-json" wrap>
                <vue-json-pretty
                  :data="JSON.parse(JSON.stringify(decodedMetadata))"
                  :deep="2"
                />
              </Cell>
            </Row>
            <Row v-if="decodedSolcVersion">
              <Cell>{{ $t('details.contract.deployment_solc_version') }}</Cell>
              <Cell wrap>{{ decodedSolcVersion }}</Cell>
            </Row>

            <Row v-if="solidityScanData">
              <Cell>
                <img
                  v-b-tooltip.hover
                  src="/img/solidity_scan.png"
                  alt=""
                  width="20"
                  class="solidity_scan_logo"
                  title="SolidityScan"
                />
                Threat Score & Vulnerabilities</Cell
              >
              <Cell wrap>
                <div>{{ solidityScanData.solidityScanThreatScore }} / 100</div>
                <div class="chevron-down" @click="toggleShowSolidityScanData">
                  <font-awesome-icon icon="chevron-down" />
                </div>
              </Cell>
            </Row>

            <Row v-if="showSolidityScanData">
              <Cell>Critical Vulnerabilities</Cell>
              <Cell wrap>
                <div
                  :class="
                    solidityScanData.critical > 0 ? 'red-cell' : 'green-cell'
                  "
                >
                  {{ solidityScanData.critical }}
                </div>
              </Cell>
            </Row>
            <Row v-if="showSolidityScanData">
              <Cell>High Vulnerabilities</Cell>
              <Cell wrap>
                <div
                  :class="solidityScanData.high > 0 ? 'red-cell' : 'green-cell'"
                >
                  {{ solidityScanData.high }}
                </div>
              </Cell>
            </Row>
            <Row v-if="showSolidityScanData">
              <Cell>Medium Vulnerabilities</Cell>
              <Cell wrap>
                <div
                  :class="
                    solidityScanData.medium > 0 ? 'red-cell' : 'green-cell'
                  "
                >
                  {{ solidityScanData.medium }}
                </div>
              </Cell>
            </Row>
            <Row v-if="showSolidityScanData">
              <Cell>Low Vulnerabilities</Cell>
              <Cell wrap>
                <div
                  :class="solidityScanData.low > 0 ? 'red-cell' : 'green-cell'"
                >
                  {{ solidityScanData.low }}
                </div>
              </Cell>
            </Row>
            <Row v-if="showSolidityScanData">
              <Cell>Informational Vulnerabilities</Cell>
              <Cell wrap>
                <div
                  :class="
                    solidityScanData.informational > 0
                      ? 'red-cell'
                      : 'green-cell'
                  "
                >
                  {{ solidityScanData.informational }}
                </div>
              </Cell>
            </Row>
            <Row v-if="showSolidityScanData">
              <Cell>Vulnerability Report</Cell>
              <Cell>
                <a
                  :href="solidityScanData.scanner_reference_url"
                  target="_blank"
                >
                  <font-awesome-icon :icon="['far', 'eye']" />
                  View Full Report
                </a>
              </Cell>
            </Row>
          </Data>

          <!-- Developer -->

          <Data v-if="tab === 'developer'">
            <Row v-if="verified">
              <Cell>{{ $t('details.contract.compiler_version') }}</Cell>
              <Cell>{{ verified.compiler_version }}</Cell>
            </Row>

            <Row v-if="verified">
              <Cell>{{ $t('details.contract.optimization') }}</Cell>
              <Cell>
                <font-awesome-icon
                  :icon="verified.optimization ? 'check' : 'times'"
                  :class="
                    verified.optimization ? 'text-success' : 'text-danger'
                  "
                />
              </Cell>
            </Row>

            <Row v-if="verified">
              <Cell>{{ $t('details.contract.runs') }}</Cell>
              <Cell>{{ verified.runs }}</Cell>
            </Row>

            <Row v-if="verified">
              <Cell>{{ $t('details.contract.target') }}</Cell>
              <Cell>{{ verified.target }}</Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.contract.license') }}</Cell>
              <Cell>{{ contract.licence }}</Cell>
            </Row>

            <Row v-if="contract.bytecode">
              <Cell>{{ $t('details.contract.bytecode') }}</Cell>
              <Cell wrap>{{ contract.bytecode }}</Cell>
            </Row>

            <Row v-if="contract.arguments">
              <Cell>{{ $t('details.contract.arguments') }}</Cell>
              <Cell wrap>{{ contract.arguments }}</Cell>
            </Row>

            <Row v-if="decodedArguments">
              <Cell>{{ $t('details.contract.decoded_arguments') }}</Cell>
              <Cell wrap>{{ decodedArguments }}</Cell>
            </Row>
          </Data>

          <!-- Execute -->
          <ContractExecute
            v-if="tab === 'execute'"
            :contract-id="address"
            :contract-name="verified.name"
            :contract-abi="verified.abi"
          />

          <!-- Verified Source -->
          <FileExplorer v-if="tab === 'source'" :data="verified.source" />

          <!-- ABI -->
          <File v-if="tab === 'abi'" :data="verified.abi" />

          <!-- Transactions -->
          <ContractTransactions
            v-if="tab === 'transactions'"
            :contract-id="address"
          />
        </Card>
      </b-container>
    </section>
  </div>
</template>
<script>
import VueJsonPretty from 'vue-json-pretty'
import { ethers, Contract } from 'ethers'
import { Provider } from '@reef-defi/evm-provider'
import { WsProvider } from '@polkadot/api'
import ERC20Abi from '../../assets/erc20Abi.json'
import ContractExecute from '../../components/ContractExecute.vue'
import ContractTransactions from '../../components/ContractTransactions.vue'
import ReefIdenticon from '@/components/ReefIdenticon.vue'
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'
import { network } from '@/frontend.config.js'
import FileExplorer from '@/components/FileExplorer'
import File from '@/components/FileExplorer/File'
import BlockTimeout from '@/utils/polling.js'
import { toIpfsReefGatewayLink } from '~/utils/ipfs'
import axiosInstance from '~/utils/axios'

export default {
  components: {
    ContractTransactions,
    ReefIdenticon,
    Loading,
    VueJsonPretty,
    ContractExecute,
    FileExplorer,
    File,
  },
  mixins: [commonMixin],
  data() {
    return {
      network,
      balance: 0,
      loading: true,
      address: this.toContractAddress(this.$route.params.id),
      contract: undefined,
      verified: undefined,
      provider: undefined,
      tab: 'general',
      callbackId: null,
      solidityScanData: null,
      showSolidityScanData: false,
    }
  },
  computed: {
    tabs() {
      if (this.verified) {
        return {
          general: 'General',
          developer: 'Developer',
          execute: 'Execute',
          source: 'Verified Source',
          abi: 'ABI',
          transactions: 'Transactions',
        }
      }
      return {
        general: 'General',
        transactions: 'Transactions',
      }
    },
    tokenData() {
      const data = this.verified?.contractData
      if (!data) {
        return null
      }
      const fullName =
        data.name && data.symbol
          ? `${data.name} (${data.symbol})`
          : this.verified.name
      return {
        ...data,
        fullName,
        address: this.address,
      }
    },
    decodedArguments() {
      if (
        this.verified.abi &&
        this.verified.abi.length > 0 &&
        this.contract.bytecode_arguments
      ) {
        try {
          const constructor = this.verified.abi.find(
            ({ type }) => type === 'constructor'
          )
          if (!constructor) {
            return ''
          }
          const constructorTypes = constructor.inputs.map((input) => input.type)
          const abiCoder = new ethers.utils.AbiCoder()
          const decoded = abiCoder.decode(
            constructorTypes,
            '0x' + this.contract.bytecode_arguments
          )
          return decoded.toString()
        } catch {
          return null
        }
      }
      return null
    },
    decodedMetadata() {
      return null
    },
    decodedSolcVersion() {
      if (this.decodedMetadata) {
        const solcVersionArray = this.decodedMetadata?.solc || null
        return `${solcVersionArray[0]}.${solcVersionArray[1]}.${solcVersionArray[2]}`
      }
      return null
    },
  },
  watch: {
    $route() {
      this.address = this.$route.params.id
    },
  },
  created() {
    this.updateData()
    BlockTimeout.addCallback(this.updateData)
  },
  destroyed() {
    BlockTimeout.removeCallback(this.updateData)
  },
  methods: {
    toggleShowSolidityScanData() {
      this.showSolidityScanData = !this.showSolidityScanData
    },
    async updateData() {
      try {
        const contractsResponse = await axiosInstance.post('', {
          query: `
            query contracts($address: String!) {
              contracts(where: { id_containsInsensitive: $address }, limit: 1) {
                id
                extrinsic {
                  block {
                    height
                  }
                  status
                }
                timestamp
                bytecode
                bytecodeContext
                bytecodeArguments
                signer {
                  id
                }
              }
            }
          `,
          variables: {
            address: this.address,
          },
        })

        if (contractsResponse.data.data.contracts[0]) {
          contractsResponse.data.data.contracts[0].address =
            contractsResponse.data.data.contracts[0].id
          contractsResponse.data.data.contracts[0].extrinsic.block_id =
            contractsResponse.data.data.contracts[0].extrinsic.block.height
          contractsResponse.data.data.contracts[0].bytecode_context =
            contractsResponse.data.data.contracts[0].bytecodeContext
          contractsResponse.data.data.contracts[0].bytecode_arguments =
            contractsResponse.data.data.contracts[0].bytecodeArguments
          contractsResponse.data.data.contracts[0].signerId =
            contractsResponse.data.data.contracts[0].signer?.id
          contractsResponse.data.data.contracts[0].statusResponse =
            contractsResponse.data.data.contracts[0].extrinsic.status
          this.contract = contractsResponse.data.data.contracts[0]
          const name =
            contractsResponse.data.data.contracts[0].verified_contract?.name

          this.contract.abi =
            contractsResponse.data.data.contracts[0].verified_contract &&
            contractsResponse.data.data.contracts[0].verified_contract
              .compiled_data &&
            contractsResponse.data.data.contracts[0].verified_contract
              .compiled_data[name]
              ? contractsResponse.data.data.contracts[0].verified_contract
                  .compiled_data[name]
              : []

          if (contractsResponse.data.data.contracts[0].verified_contract) {
            this.contract.source = Object.keys(
              contractsResponse.data.data.contracts[0].verified_contract.source
            ).reduce(
              this.sourceCode(contractsResponse.data.data.contracts[0]),
              []
            )
          }

          if (
            this.contract.bytecode_context &&
            !this.contract.bytecode_context.startsWith('0x')
          ) {
            this.contract.bytecode_context =
              '0x' + this.contract.bytecode_context
          }
        }

        const provider = new Provider({
          provider: new WsProvider(network.nodeWs),
        })
        await provider.api.isReady
        const contract = new Contract(
          '0x0000000000000000000000000000000001000000',
          ERC20Abi,
          provider
        )
        const balance = await contract.balanceOf(this.address)
        await provider.api.disconnect()
        this.balance = balance.toString()
        this.loading = false
      } catch (error) {}

      try {
        const verifiedContractsResponse = await axiosInstance.post('', {
          query: `
            query verified_contract($address: String!) {
              verifiedContracts(
                where: { id_containsInsensitive: $address }
                limit: 1
              ) {
                id
                name
                type
                compilerVersion
                contractData
                compiledData
                source
                optimization
                runs
                target
              }
            }
          `,
          variables: {
            address: this.address,
          },
        })

        if (verifiedContractsResponse.data.data.verifiedContracts[0]) {
          this.verified =
            verifiedContractsResponse.data.data.verifiedContracts[0]
          this.iconUrl =
            this.verified.contractData.iconUrl !== undefined
              ? toIpfsReefGatewayLink(this.verified.contractData.iconUrl)
              : undefined
          this.verified.compiler_version = this.verified.compilerVersion
          this.verified.compiled_data = this.verified.compiledData
          this.verified.abi =
            this.verified.compiled_data &&
            this.verified.compiled_data[this.verified.name]
              ? this.verified.compiled_data[this.verified.name]
              : []
          try {
            const resp = await axiosInstance.get(
              `${network.solidityScanApi}/${this.address}`
            )
            this.solidityScanData = resp.data.data
          } catch (error) {}
        }
      } catch (error) {}
    },
    getIpfsHash() {
      return null
    },
    getBzzr1Hash() {
      return null
    },
  },
}
</script>

<style lang="scss">
.contract-details {
  .contract-details__source {
    background: rgba(#eaedf3, 0.5);
  }

  .green-cell {
    color: green !important;
    font-weight: bolder !important;
  }

  .red-cell {
    color: red !important;
    font-weight: bolder !important;
  }

  .details-headline {
    & + * {
      margin-top: 15px;
    }
  }

  .contract-details__identicon {
    display: flex;
    justify-content: center;
    align-items: center;
    background: white;
    box-shadow: 0 0 10px -10px rgba(#0f233f, 0.5),
      0 5px 15px -5px rgba(#0f233f, 0.25);
    border-radius: 50%;
    height: 110px;
    width: 110px;
    margin: 0 auto 15px auto;
    overflow: hidden;

    img {
      border-radius: 50%;
    }
  }

  .contract-details__account-identicon {
    display: flex !important;
  }

  .tabs {
    margin: 25px 0;
  }

  .token__identicon {
    background-color: #eaedf3;
    margin-right: 4px;
    border-radius: 50px;
    border: 2px solid white;
  }

  .solidity_scan_logo {
    width: 20px;
    padding: 2px;
    background-color: black;
    border-radius: 100px;
    margin-right: 6px;
  }

  .chevron-down {
    margin-left: 6px;

    &:hover {
      cursor: pointer;
    }
  }

  .data {
    .table-cell {
      & + .table-cell {
        .table-cell__content-wrapper {
          align-items: flex-end;

          .table-cell__content {
            text-align: right;
          }

          > * {
            text-align: right;
          }
        }
      }
    }
  }
}
</style>
