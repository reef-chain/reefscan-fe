<template>
  <div class="list-view tokens">
    <Search
      v-model="filter"
      :placeholder="$t('pages.tokens.search_placeholder')"
      :label="`${$t('pages.tokens.title')} ${
        formatNumber(totalRows) <= 1 ? '' : formatNumber(totalRows)
      }`"
    />

    <section>
      <b-container>
        <div class="list-view__table">
          <div v-if="loading" class="text-center py-4">
            <Loading />
          </div>
          <Table v-else>
            <THead>
              <Cell>Name</Cell>
              <Cell>Icon</Cell>
              <Cell>Symbol</Cell>
              <Cell>Contract Address</Cell>
              <Cell>Created at block</Cell>
              <!--              TODO Ziga
              <Cell align="right">Total supply</Cell>-->
            </THead>

            <Row v-for="(item, index) in tokens" :key="index">
              <Cell v-if="item.contract_data" :link="`/token/${item.address}`">
                <img
                  v-if="item.contract_data.token_icon_url"
                  :src="item.contract_data.token_icon_url"
                  class="identicon"
                />
                <span>{{ item.contract_data.name || item.name }}</span>
                <font-awesome-icon
                  v-if="item.verified_contract"
                  v-b-tooltip.hover
                  icon="check"
                  class="validated"
                  title="Validated Token"
                />
              </Cell>
              <Cell>
                <img
                  v-if="item.token_icon"
                  :src="item.token_icon"
                  style="width: 22px; height: 22px"
                />
                <!-- <eth-identicon
                  v-if="!item.token_icon"
                  :address="item.address"
                  :size="32"
                /> -->
                <!-- <span v-if="!item.token_icon"> No Icon</span> -->
              </Cell>
              <Cell
                v-if="item.contract_data && item.contract_data.symbol"
                :link="`/token/${item.address}`"
              >
                <span>{{ item.contract_data.symbol }}</span>
                <font-awesome-icon
                  v-if="item.verified_contract"
                  v-b-tooltip.hover
                  icon="check"
                  class="validated"
                  title="Validated Token"
                />
              </Cell>

              <Cell v-else />

              <Cell :link="{ url: `/token/${item.address}`, fill: false }">
                <eth-identicon :address="item.address" :size="20" />
                <span>{{ shortHash(item.address) }}</span>
              </Cell>

              <!-- TODO Ziga
              <Cell align="right">{{ getItemSupply(item) }}</Cell>-->

              <Cell
                :link="{
                  url: `/block?blockNumber=${item.contract.extrinsic.block_id}`,
                  fill: false,
                }"
              >
                # {{ formatNumber(item.contract.extrinsic.block_id) }}
              </Cell>
            </Row>
          </Table>

          <div class="list-view__pagination">
            <PerPage v-model="perPage" />
            <b-pagination
              v-model="currentPage"
              :total-rows="totalRows"
              :per-page="perPage"
            />
          </div>
        </div>
      </b-container>
    </section>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import Loading from '@/components/Loading.vue'
import Search from '@/components/Search'
import { paginationOptions } from '@/frontend.config.js'
import BlockTimeout from '@/utils/polling.js'

const FIRST_BATCH_QUERY = gql`
  query tokens($first: Int = 10, $where: VerifiedContractWhereInput = {}) {
    verifiedContracts: verifiedContractsConnection(
      first: $first
      orderBy: contract_timestamp_DESC
      where: $where
    ) {
      edges {
        node {
          id
          contractData
          name
          contract {
            timestamp
            extrinsic {
              hash
              block {
                height
              }
            }
            signer {
              id
            }
          }
        }
      }
    }
    totalTokens: verifiedContractsConnection(
      orderBy: id_ASC
      where: { type_not_eq: other }
    ) {
      totalCount
    }
  }
`

const NEXT_BATCH_QUERY = gql`
  query tokens(
    $after: String!
    $first: Int = 10
    $where: VerifiedContractWhereInput = {}
  ) {
    verifiedContracts: verifiedContractsConnection(
      first: $first
      orderBy: contract_timestamp_DESC
      after: $after
      where: $where
    ) {
      edges {
        node {
          id
          contractData
          name
          contract {
            timestamp
            extrinsic {
              hash
              block {
                height
              }
            }
            signer {
              id
            }
          }
        }
      }
    }
    totalTokens: verifiedContractsConnection(
      orderBy: id_ASC
      where: { type_not_eq: other }
    ) {
      totalCount
    }
  }
`

export default {
  components: {
    Loading,
    Search,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      filter: '',
      tokens: [],
      paginationOptions,
      perPage: 10,
      currentPage: 1,
      totalRows: 0,
      nTokens: 0,
      callbackId: null,
      previousPage: null,
      forceLoad: false,
    }
  },
  computed: {
    queryToExecute() {
      if (this.currentPage === 1) {
        return FIRST_BATCH_QUERY
      } else {
        return NEXT_BATCH_QUERY
      }
    },
  },
  watch: {
    currentPage() {
      if (this.currentPage === 1) {
        // if moving from any other page to page 1
        if (this.previousPage !== 1) {
          this.loading = true // set loading to true before refetching
          this.forceLoad = true
          setTimeout(() => {
            this.$apollo.queries.verifiedContracts.refetch()
            this.forceLoad = false
          }, 100)
        }
        BlockTimeout.addCallback(this.updateData)
      } else {
        BlockTimeout.removeCallback(this.updateData)
      }
    },
  },
  created() {
    BlockTimeout.addCallback(this.updateData)
  },
  destroyed() {
    BlockTimeout.removeCallback(this.updateData)
  },
  apollo: {
    verifiedContracts: {
      query: function () {
        return this.queryToExecute
      },
      variables() {
        const where = {
          type_not_eq: 'other',
        }
        if (this.isContractId(this.filter))
          where.id_containsInsensitive = this.toContractAddress(this.filter)

        return {
          first: this.perPage,
          after: ((this.currentPage - 1) * this.perPage).toString(),
          where,
        }
      },
      fetchPolicy: 'network-only',
      result({ data }) {
        const dataArr = []
        if (data.verifiedContracts.edges) {
          for (let idx = 0; idx < data.verifiedContracts.edges.length; idx++) {
            dataArr.push(data.verifiedContracts.edges[idx].node)
          }
          data.verifiedContracts = dataArr
          this.verifiedContracts = dataArr
        }
        if (data && data.verifiedContracts) {
          this.tokens = data.verifiedContracts.map((token) => {
            return {
              ...token,
              address: token.id,
              contract: {
                ...token.contract,
                extrinsic: {
                  ...token.contract.extrinsic,
                  block_id: token.contract.extrinsic.block.height,
                },
                token_holders_aggregate: {
                  aggregate: {
                    count: 0, // TODO: token holder amount won't work because aggregates don't exist the way they did
                  },
                },
              },
              contract_data: token.contractData,
              token_icon: token.contractData.iconUrl
                ? token.contractData.iconUrl.replace(
                    'ipfs://',
                    'https://ipfs.io/ipfs/'
                  )
                : undefined,
            }
          })
          this.totalRows = this.filter ? this.tokens.length : this.nTokens
          this.nTokens = data.totalTokens.totalCount
          this.totalRows = this.nTokens
        }
        this.loading = false
      },
    },
  },
  methods: {
    updateData() {
      this.$apollo.queries.verifiedContracts.refetch()
    },
    getItemSupply(item) {
      const supply = this.formatTokenAmount(
        item.token_total_supply || 0,
        item.token_decimals || 0,
        item.token_symbol || ''
      ).trim()

      if (supply === '0.00') return ''

      return supply
    },
  },
}
</script>

<style lang="scss">
.tokens {
  * + .validated {
    margin-left: 6px;
  }

  .validated {
    color: lightgreen;
  }
}

img {
  border-radius: 50%;
}
</style>
