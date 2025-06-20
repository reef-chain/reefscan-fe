<template>
  <div class="account-token-balances list-view">
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <div v-else-if="balances.length === 0" class="text-center py-4">
      <h5>{{ $t('components.account_token_balances.no_token_found') }}</h5>
    </div>
    <div v-else>
      <div class="list-view__table-head">
        <Input
          v-model="filter"
          :placeholder="$t('components.account_token_balances.search')"
        />
        <JsonCSV
          :data="balances"
          class="list-view__download-btn"
          :name="`reef_token_balances_${accountId}.csv`"
        >
          <font-awesome-icon icon="file-csv" />
          <span>{{ $t('pages.accounts.download_csv') }}</span>
        </JsonCSV>
      </div>

      <Table>
        <THead>
          <Cell :sortable="['token_name', activeSort]">Token</Cell>
          <Cell :sortable="['contract_id', activeSort]">Address</Cell>
          <Cell :sortable="['balance', activeSort]" align="right">Balance</Cell>
        </THead>

        <Row v-for="(item, index) in list" :key="index">
          <Cell :link="`/token/${item.contract_id}`">{{
            item.token_name
          }}</Cell>

          <Cell :link="{ url: `/contract/${item.contract_id}`, fill: false }">
            <eth-identicon :address="item.contract_id" :size="20" />
            <span>{{ item.contract_id }}</span>
          </Cell>

          <Cell align="right">
            {{
              formatShortAmount(
                item.balance,
                item.token_symbol,
                item.token_decimals
              )
            }}
          </Cell>
        </Row>
      </Table>

      <div class="list-view__pagination">
        <PerPage v-model="perPage" />
        <b-pagination
          v-model="currentPage"
          :total-rows="searchResults.length"
          :per-page="perPage"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { network as nw } from '@reef-chain/util-lib'
import JsonCSV from 'vue-json-csv'
import axiosInstance from '@/utils/axios'
import commonMixin from '@/mixins/commonMixin.js'
import Loading from '@/components/Loading.vue'
import { paginationOptions } from '@/frontend.config.js'
import Input from '@/components/Input'
import tableUtils from '@/mixins/tableUtils'
import ObsPolling from '~/utils/obsPolling'

const FIRST_BATCH_QUERY = `
  query token_holder($accountId: String!, $first: Int!) {
    tokenHolders: tokenHoldersConnection(
      orderBy: balance_DESC
      where: {
        signer: { id_eq: $accountId }
        AND: { token: { type_eq: ERC20 } }
      }
      first: $first
    ) {
      edges {
        node {
          signer {
            id
            evmAddress
          }
          balance
          token {
            id
            contractData
          }
        }
      }
      totalCount
    }
  }
`

const NEXT_BATCH_QUERY = `
  query token_holder($accountId: String!, $after: String!, $first: Int!) {
    tokenHolders: tokenHoldersConnection(
      orderBy: balance_DESC
      where: {
        signer: { id_eq: $accountId }
        AND: { token: { type_eq: ERC20 } }
      }
      first: $first
      after: $after
    ) {
      edges {
        node {
          signer {
            id
            evmAddress
          }
          balance
          token {
            id
            contractData
          }
        }
      }
      totalCount
    }
  }
`

export default {
  components: {
    JsonCSV,
    Loading,
    Input,
  },
  mixins: [commonMixin, tableUtils],
  props: {
    accountId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      loading: true,
      balances: [],
      filter: null,
      filterOn: [],
      tableOptions: paginationOptions,
      perPage: paginationOptions[0],
      currentPage: 1,
      totalRows: 1,
      callbackId: null,
    }
  },
  computed: {
    searchResults() {
      const list = this.balances || []

      if (!this.filter) return list

      return list.filter((item) => {
        const filter = this.filter.toLowerCase()
        const name = item.token_name ? item.token_name.toLowerCase() : ''
        const address = item.contract_id ? item.contract_id.toLowerCase() : ''

        return name.includes(filter) || address.includes(filter)
      })
    },
    list() {
      return this.searchResults.slice(0, this.perPage)
    },
  },
  watch: {
    perPage() {
      this.updateData()
    },
    currentPage() {
      this.updateData()
    },
  },
  created() {
    this.updateData()
    ObsPolling.addCallback(
      nw.getLatestBlockAccountUpdates$([this.accountId]),
      this.updateData
    )
  },
  destroyed() {
    ObsPolling.removeCallback(this.updateData)
  },
  methods: {
    handleNumFields(num) {
      localStorage.paginationOptions = num
      this.perPage = parseInt(num)
    },
    async updateData() {
      try {
        const response = await axiosInstance.post('', {
          query: this.currentPage === 1 ? FIRST_BATCH_QUERY : NEXT_BATCH_QUERY,
          variables: {
            accountId: this.accountId,
            first: this.perPage,
            after: ((this.currentPage - 1) * this.perPage).toString(),
          },
        })

        const totalCount = response.data.data.tokenHolders.totalCount
        this.balances = response.data.data.tokenHolders.edges.map((edge) => {
          const balance = edge.node
          return {
            contract_id: balance.token.id,
            holder_account_id: balance.signer.id,
            holder_evm_address: balance.signer.evmAddress,
            balance: balance.balance.toLocaleString('fullwide', {
              useGrouping: false,
            }),
            token_name: balance.token.contractData?.name,
            token_symbol: balance.token.contractData?.symbol,
            token_decimals: balance.token.contractData?.decimals,
          }
        })
        this.totalRows = totalCount
        if (this.filter) this.totalRows = this.balances.length
        this.loading = false
      } catch (error) {
        // Handle error
      }
    },
    setPerPage(value) {
      this.perPage = value
    },
  },
}
</script>

<style>
.account-token-balances {
  background-color: white;
}
.spinner {
  color: #d3d2d2;
}
</style>
