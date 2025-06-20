<template>
  <div class="staking-slashes list-view">
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <div v-else-if="stakingSlashes.length === 0" class="text-center py-4">
      <h5>{{ $t('components.staking_slashes.no_slash_found') }}</h5>
    </div>
    <div v-else>
      <div class="list-view__table-head">
        <Input
          v-model="filter"
          :placeholder="$t('components.staking_slashes.search')"
        />
        <JsonCSV
          :data="stakingSlashes"
          class="list-view__download-btn"
          :name="`polkastats_staking_slashes_${accountId}.csv`"
        >
          <font-awesome-icon icon="file-csv" />
          <span>{{ $t('pages.accounts.download_csv') }}</span>
        </JsonCSV>
      </div>
      <Table>
        <THead>
          <Cell :sortable="['block_id', activeSort]">Block Number</Cell>
          <Cell :sortable="['timestamp', activeSort]">Date</Cell>
          <Cell :sortable="['timeago', activeSort, true]">Time Ago</Cell>
          <Cell :sortable="['amount', activeSort]" align="right">Slash</Cell>
        </THead>

        <Row v-for="(item, index) in list" :key="index">
          <Cell :link="`/block?blockNumber=${item.block_id}`">
            # {{ formatNumber(item.block_id) }}
          </Cell>

          <Cell>{{ getDateFromTimestamp(item.timestamp) }}</Cell>

          <Cell>{{ fromNow(item.timeago) }}</Cell>

          <Cell align="right">{{ formatAmount(item.amount, 6) }}</Cell>
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
import commonMixin from '@/mixins/commonMixin.js'
import Loading from '@/components/Loading.vue'
import { paginationOptions } from '@/frontend.config.js'
import Input from '@/components/Input'
import tableUtils from '@/mixins/tableUtils'
import ObsPolling from '~/utils/obsPolling'
import axiosInstance from '~/utils/axios'

export default {
  components: {
    Loading,
    JsonCSV,
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
      stakingSlashes: [],
      filter: null,
      filterOn: [],
      tableOptions: paginationOptions,
      perPage: null,
      currentPage: 1,
      totalRows: 1,
      callbackId: null,
      previousPage: null,
    }
  },
  computed: {
    searchResults() {
      const list = this.stakingSlashes || []

      if (!this.filter) return list

      return list.filter((item) => {
        const filter = this.filter.toLowerCase()
        const block = item.block_id ? String(item.block_id).toLowerCase() : ''
        return block.includes(filter)
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
    async updateData() {
      const STAKING_SLASH_QUERY = `
        query staking_slash($accountId: String!) {
          staking_slash(
            order_by: { block_id: desc }
            where: { account_id: { _eq: $accountId } }
          ) {
            block_id
            event_index
            amount
            timestamp
          }
        }
      `
      try {
        const response = await axiosInstance.post('', {
          query: STAKING_SLASH_QUERY,
          variables: {
            accountId: this.accountId,
          },
        })
        const data = await response.data.data
        this.stakingSlashes = data.staking_slash.map((event) => {
          return {
            block_id: event.block_id,
            timestamp: event.timestamp,
            timeago: event.timestamp,
            amount: event.amount,
          }
        })
        this.totalRows = this.stakingSlashes.length
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
