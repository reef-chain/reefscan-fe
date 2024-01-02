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
          <Cell>NFT ID</Cell>
          <Cell>Address</Cell>
          <Cell>Type</Cell>
          <Cell :sortable="['balance', activeSort]">Balance</Cell>
        </THead>

        <Row v-for="(item, index) in list" :key="index">
          <Cell :link="`/contract/${item.token.id}`">{{ item.nftId }}</Cell>

          <Cell :link="{ url: `/contract/${item.token.id}`, fill: false }">
            <eth-identicon :address="item.token.id" :size="20" />
            <span>{{ shortAddress(item.token.id) }}</span>
          </Cell>

          <Cell> {{ item.token.type }} </Cell>
          <Cell align="right"> {{ item.balance }} </Cell>
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
      perPage: null,
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
      return this.paginate(
        this.sort(this.searchResults),
        this.perPage,
        this.currentPage
      )
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
          query: `
            query signer_nfts($accountId: String) {
              tokenHolders(
                orderBy: balance_DESC
                limit: 199
                where: {
                  AND: {
                    nftId_isNull: false
                    token: { id_isNull: false }
                    signer: { id_eq: $accountId }
                    balance_gt: "0"
                  }
                  type_eq: Account
                }
              ) {
                token {
                  id
                  type
                }
                balance
                nftId
              }
            }
          `,
          variables: {
            accountId: this.accountId,
          },
        })

        this.balances = response.data.data.tokenHolders
        this.totalRows = this.balances.length
        this.loading = false
      } catch (error) {
        this.setPerPage(20)
        this.$bvToast.toast(`Exceeds the size limit`, {
          title: 'Encountered an Error',
          variant: 'danger',
          autoHideDelay: 5000,
          appendToast: false,
        })
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
