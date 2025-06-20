<template>
  <div>
    <section>
      <b-container class="token-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <NotFound v-else-if="!contract" text="Token not found" />

        <Card v-else class="token-details">
          <div class="token-details__identicon">
            <eth-identicon v-if="!iconUrl" :address="address" :size="80" />
            <img
              v-if="iconUrl"
              :src="iconUrl"
              style="width: 80px; height: 80px"
            />
          </div>

          <Headline>
            <span>{{ tokenName }}</span>
          </Headline>
          <h4 class="text-center mb-4">
            <p class="mt-3">
              <b-badge class="ml-2" variant="info">{{
                contractType.toUpperCase()
              }}</b-badge>
              <b-badge
                v-if="contract.verified_contract"
                class="ml-2"
                variant="success"
              >
                Verified source
                <font-awesome-icon icon="check" />
              </b-badge>
              <b-badge v-else class="ml-2" variant="danger">
                Not verified source
                <font-awesome-icon icon="times" />
              </b-badge>
            </p>
          </h4>
          <div class="unverified-section">
            <nuxt-link
              v-if="isTokenUriFunc"
              :to="`/token/updateIcon/${address}`"
              class="unverified-section__verify-btn"
            >
              Upload Icon
            </nuxt-link>
            <b-alert v-if="!isTokenUriFunc" show>
              You can not update token icon as there is no function in this
              contract for that.
            </b-alert>
          </div>
          <Tabs v-model="tab" :options="tabs" />

          <!-- Info -->

          <Data v-if="tab === 'info'">
            <Row>
              <Cell>Contract address</Cell>
              <Cell>
                <eth-identicon :address="address" :size="16" />
                <nuxt-link :to="`/contract/${address}`">
                  {{ address }}
                </nuxt-link>
              </Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.token.token_name') }}</Cell>
              <Cell>{{
                contract.verified_contract &&
                contract.verified_contract.contractData
                  ? contract.verified_contract.contractData.name
                  : ''
              }}</Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.token.token_symbol') }}</Cell>
              <Cell>{{
                contract.verified_contract.contractData
                  ? contract.verified_contract.contractData.symbol
                  : ''
              }}</Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.token.token_decimals') }}</Cell>
              <Cell>{{
                contract.verified_contract.contractData
                  ? contract.verified_contract.contractData.decimals
                  : ''
              }}</Cell>
            </Row>
            <!--            TODO Ziga
            <Row>
              <Cell>{{ $t('details.token.token_total_supply') }}</Cell>
              <Cell class="token-details__amount">
                {{
                  formatTokenAmount(
                    contract.token_total_supply,
                    contract.token_decimals,
                    contract.token_symbol
                  )
                }}
              </Cell>
            </Row>-->

            <Row>
              <Cell>Token Holders</Cell>
              <Cell>
                {{ formatNumber(holders) }}
              </Cell>
            </Row>
            <Row>
              <Cell>Total Supply</Cell>
              <Cell>
                {{ contract.total_supply }}
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

            <Row v-if="contract.extrinsic.signer">
              <Cell>{{ $t('details.token.created') }}</Cell>
              <Cell>
                <ReefIdenticon
                  :key="contract.extrinsic.signer"
                  :address="contract.extrinsic.signer"
                  :size="20"
                  class="token-details__account-identicon"
                />
                <nuxt-link :to="`/account/${contract.extrinsic.signer}`">
                  {{ shortAddress(contract.extrinsic.signer) }}
                </nuxt-link>
              </Cell>
            </Row>
          </Data>

          <!-- Holders -->
          <TokenHolders
            v-if="tab === 'holders'"
            :token-id="$route.params.id"
            :decimals="tokenData.decimals"
            :symbol="tokenData.symbol"
          />

          <!-- Transfers -->

          <TokenTransfers
            v-if="tab === 'transfers'"
            :token-id="$route.params.id"
            :decimals="tokenData.decimals"
            :symbol="tokenData.symbol"
          />
          <!-- Execute -->
          <contract-execute
            v-if="tab === 'execute'"
            :contract-id="address"
            :contract-name="contract.verified_contract.name"
            :contract-abi="contract.abi"
          />
        </Card>
      </b-container>
    </section>
  </div>
</template>
<script>
import { ethers } from 'ethers'
import { reefState } from '@reef-chain/util-lib'
import ContractExecute from '../../components/ContractExecute.vue'
import Loading from '@/components/Loading.vue'
import ReefIdenticon from '@/components/ReefIdenticon.vue'
import { network } from '@/frontend.config.js'
import commonMixin from '@/mixins/commonMixin.js'
import TokenHolders from '@/components/TokenHolders'
import TokenTransfers from '@/components/TokenTransfers'
import axiosInstance from '~/utils/axios'
import { toIpfsReefGatewayLink } from '~/utils/ipfs'

export default {
  components: {
    ReefIdenticon,
    Loading,
    TokenHolders,
    TokenTransfers,
    ContractExecute,
  },
  mixins: [commonMixin],
  data() {
    return {
      network,
      loading: true,
      address: this.toContractAddress(this.$route.params.id),
      contract: undefined,
      tab: 'info',
      callbackId: null,
      isTokenUriFunc: false,
    }
  },
  computed: {
    tabs() {
      if (this.contract?.verified_contract) {
        return {
          info: 'Token Info',
          holders: 'Holders',
          transfers: 'Transfers',
        }
      }

      return {
        info: 'Token Info',
        holders: 'Holders',
      }
    },
    tokenData() {
      const data = this.contract?.verified_contract?.contractData || {}

      return {
        ...data,
        address: this.address,
      }
    },
    tokenName() {
      const data = this.tokenData
      if (data.name && data.symbol) {
        return `${data.name} (${data.symbol})`
      }

      return this.contractName
    },
  },
  watch: {
    $route() {
      this.address = this.$route.params.id
      this.updateData()
    },
  },
  created() {
    this.updateData()
  },
  destroyed() {
    this.subscription.unsubscribe()
  },
  methods: {
    async updateData() {
      try {
        const response = await axiosInstance.post('', {
          query: `
            query contract($address: String = "") {
              verifiedContracts(
                limit: 1
                where: { id_containsInsensitive: $address }
              ) {
                id
                contractData
                name
                contract {
                  extrinsic {
                    block {
                      height
                    }
                    signer
                  }
                  signer {
                    id
                  }
                  bytecode
                  timestamp
                }
                type
                target
                runs
                optimization
                source
                args
                compiledData
                compilerVersion
              }
            }
          `,
          variables: {
            address: this.address,
          },
        })

        const data = response.data.data
        if (data.verifiedContracts[0]) {
          const { name, type, contract, compiledData, source, contractData } =
            data.verifiedContracts[0]
          this.contractType = type.replace('ERC', 'ERC-')
          this.contractName = name
          this.contract = contract
          this.iconUrl =
            contractData.iconUrl !== undefined
              ? toIpfsReefGatewayLink(contractData.iconUrl)
              : undefined
          this.contract.extrinsic.block_id = contract.extrinsic.block.height
          this.contract.verified_contract = data.verifiedContracts[0]
          this.contract.abi = compiledData[name] || []
          this.contract.source = Object.keys(source).reduce(
            this.sourceCode(data),
            []
          )
        }
        for (let i = 0; i < this.contract.abi.length; i++) {
          if (this.contract.abi[i].name === 'renounceOwnership') {
            this.isTokenUriFunc = true
          }
        }

        const holdersResponse = await axiosInstance.post('', {
          query: `
            query tokenHoldersAggregate($address: String!) {
              tokenHoldersCount(tokenId: $address) {
                count
              }
            }
          `,
          variables: {
            address: this.address,
          },
        })

        const holdersData = holdersResponse.data.data
        if (holdersData.tokenHoldersCount) {
          this.holders = holdersData.tokenHoldersCount.count
        }
        this.subscription = reefState.selectedProvider$.subscribe(
          async (provider) => {
            const contractInstance = new ethers.Contract(
              this.address,
              [
                {
                  name: 'totalSupply',
                  type: 'function',
                  inputs: [],
                  outputs: [
                    {
                      name: '',
                      type: 'uint256',
                      internalType: 'uint256',
                    },
                  ],
                  stateMutability: 'view',
                },
                {
                  name: 'decimals',
                  type: 'function',
                  inputs: [],
                  outputs: [
                    {
                      name: '',
                      type: 'uint8',
                      internalType: 'uint8',
                    },
                  ],
                  stateMutability: 'view',
                },
              ],
              provider
            )
            const totalSupply = await contractInstance.totalSupply()
            const decimals = await contractInstance.decimals()
            this.contract.total_supply = ethers.utils.formatUnits(
              totalSupply,
              decimals
            )

            this.loading = false
          }
        )
      } catch (error) {}
    },
  },
}
</script>

<style lang="scss">
.token-details {
  .details-headline {
    & + * {
      margin-top: 15px;
    }
  }

  .token-details__identicon {
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

  .tabs {
    margin: 25px 0;
  }

  .token-details__amount {
    .table-cell__content {
      font-weight: 600;
    }
  }

  .token-details__account-identicon {
    display: flex !important;
  }

  .token-details__source {
    background: rgba(#eaedf3, 0.5);
  }
}
</style>
