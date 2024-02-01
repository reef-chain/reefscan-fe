<template>
  <div class="list-view">
    <Search
      v-model="filter"
      :placeholder="$t('pages.transfers.search_placeholder')"
      :label="`${$t('pages.transfers.title')} ${
        formatNumber(totalRows) <= 1 ? '' : formatNumber(totalRows)
      }`"
    />

    <section>
      <b-container>
        <div class="list-view__table">
          <div v-if="loading" class="text-center py-4">
            <Loading />
          </div>
          <Table v-else-if="!loading && transfers.length">
            <THead>
              <Cell>Transfer</Cell>
              <Cell>Extrinsic</Cell>
              <Cell>From</Cell>
              <Cell>To</Cell>
              <Cell>Amount</Cell>
              <Cell>Age</Cell>
              <Cell align="right">Success</Cell>
            </THead>

            <Row v-for="(item, index) in transfers" :key="index">
              <Cell
                :link="`/transfer/${item.block_id}/${item.idx}/${item.index}`"
                >{{ shortHash(item.hash) }}</Cell
              >
              <!-- <Cell :link="`/transfer/${item.hash}`">
                {{ shortHash(item.hash) }}
              </Cell> -->
              <Cell :link="`/extrinsic/${item.block_id}/${item.idx}`">
                #{{ formatNumber(item.block_id) }}-{{ formatNumber(item.idx) }}
              </Cell>

              <Cell
                :link="{ url: `/account/${item.from}`, fill: false }"
                :title="$t('pages.accounts.account_details')"
              >
                <ReefIdenticon
                  :key="item.from"
                  :address="item.from"
                  :size="20"
                />
                <span>{{ shortAddress(item.from) }}</span>
              </Cell>

              <Cell
                :link="{ url: `/account/${item.to}`, fill: false }"
                :title="$t('pages.accounts.account_details')"
              >
                <ReefIdenticon
                  v-if="isValidAddressPolkadotAddress(item.to)"
                  :key="item.to"
                  :address="item.to"
                  :size="20"
                />
                <eth-identicon v-else :address="item.to" :size="20" />
                <span>{{
                  isValidAddressPolkadotAddress(item.to)
                    ? shortAddress(item.to)
                    : shortHash(item.to)
                }}</span>
              </Cell>

              <Cell>{{
                item.isNft
                  ? formatNftTransfer(item.amount)
                  : formatShortAmount(item.amount, item.symbol, item.decimals)
              }}</Cell>

              <Cell
                v-b-tooltip.hover
                class="list-view__age"
                :title="formatTimestamp(item.timestamp)"
              >
                <font-awesome-icon :icon="['far', 'clock']" />
                <span>{{ getAge(item.timestamp) }}</span>
              </Cell>

              <Cell align="center">
                <font-awesome-icon
                  v-if="item.success"
                  icon="check"
                  class="text-success"
                />
                <font-awesome-icon v-else icon="times" class="text-danger" />
              </Cell>
            </Row>
          </Table>
          <div v-else class="py-4">
            <div class="no-data-found">No data found</div>
          </div>
          <div v-if="transfers.length" class="list-view__pagination">
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
import { network as nw } from '@reef-chain/util-lib'
import commonMixin from '@/mixins/commonMixin.js'
import Loading from '@/components/Loading.vue'
import ReefIdenticon from '@/components/ReefIdenticon.vue'
import { paginationOptions } from '@/frontend.config.js'
import axiosInstance from '~/utils/axios'
import ObsPolling from '~/utils/obsPolling'

const GET_TRANSFER_EXTRINSIC_EVENTS = `
  query extrinsic($exId: bigint!) {
    extrinsic(where: { id: { _eq: $exId } }) {
      id
      hash
      index
      events(where: { method: { _eq: "Transfer" } }) {
        data
        extrinsic_id
      }
    }
  }
`
const FIRST_BATCH_QUERY = `
  query transfer($first: Int!, $where: TransferWhereInput) {
    extrinsic: transfersConnection(
      first: $first
      orderBy: timestamp_DESC
      where: $where
    ) {
      edges {
        node {
          nftId
          to {
            id
            evmAddress
          }
          token {
            id
            contractData
          }
          from {
            id
            evmAddress
          }
          blockHeight
          success
          errorMessage
          extrinsicId
          extrinsicHash
          extrinsicIndex
          id
          amount
          timestamp
          denom
        }
      }
    }
  }
`
const NEXT_BATCH_QUERY = `
  query transfer($first: Int!, $after: String!, $where: TransferWhereInput) {
    extrinsic: transfersConnection(
      first: $first
      orderBy: timestamp_DESC
      after: $after
      where: $where
    ) {
      edges {
        node {
          nftId
          to {
            id
            evmAddress
          }
          token {
            id
            contractData
          }
          from {
            id
            evmAddress
          }
          blockHeight
          success
          errorMessage
          extrinsicId
          extrinsicHash
          extrinsicIndex
          id
          amount
          timestamp
          denom
        }
      }
    }
  }
`
export default {
  components: {
    ReefIdenticon,
    Loading,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      filter: null,
      transfers: [],
      paginationOptions,
      perPage: paginationOptions[1],
      currentPage: 1,
      totalRows: 1,
      nTransfers: 1,
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
            this.forceLoad = false
          }, 100)
        }
        ObsPolling.addCallback(
          nw.getLatestBlockAccountUpdates$([]),
          this.updateData
        )
      } else {
        ObsPolling.removeCallback(this.updateData)
      }
      this.updateData()
    },
    filter() {
      this.updateData()
    },
    perPage() {
      this.updateData()
    },
  },
  created() {
    this.updateData()
    ObsPolling.addCallback(
      nw.getLatestBlockAccountUpdates$([]),
      this.updateData
    )
  },
  destroyed() {
    ObsPolling.removeCallback(this.updateData)
  },
  methods: {
    async updateData() {
      try {
        const getVariables = () => {
          let where = {}
          if (this.filter) {
            if (this.isBlockNumber(this.filter)) {
              where = {
                extrinsic: {
                  block: { height_eq: parseInt(this.filter) },
                },
              }
            } else if (this.isHash(this.filter)) {
              where = {
                extrinsic: {
                  hash_eq: this.filter,
                },
              }
            }
          }
          return {
            where,
            first: this.perPage,
            after: ((this.currentPage - 1) * this.perPage).toString(),
          }
        }
        const [response, totalTxResponse] = await Promise.all([
          axiosInstance.post('', {
            query:
              this.currentPage === 1 ? FIRST_BATCH_QUERY : NEXT_BATCH_QUERY,
            variables: getVariables(),
          }),
          axiosInstance.post('', {
            query: `
              query total {
                totalTransfers: chainInfos(where: { id_eq: "transfers" }) {
                  count
                }
              }
            `,
            variables: getVariables(),
          }),
        ])
        const data = response.data.data
        const dataArr = []
        if (data.extrinsic.edges) {
          for (let idx = 0; idx < data.extrinsic.edges.length; idx++) {
            dataArr.push(data.extrinsic.edges[idx].node)
          }
          data.extrinsic = dataArr
          this.extrinsic = dataArr
        }
        const converted = data.extrinsic.map((transfer) => {
          return {
            amount: transfer.amount,
            success: transfer.success,
            timestamp: transfer.timestamp,
            hash: transfer.extrinsicHash,
            idx: transfer.extrinsicIndex,
            extrinsicId: transfer.extrinsicId,
            index: parseInt(transfer.id.split('-')[2]),
            block_id: transfer.blockHeight,
            isNft: transfer.nftId !== null,
            to:
              transfer.to.id === null ? transfer.to.evmAddress : transfer.to.id,
            from:
              transfer.from.id === null
                ? transfer.from.evmAddress
                : transfer.from.id,
            symbol: transfer.token.contractData?.symbol || ' ', // TODO: fix this
            decimals:
              transfer.token.verified_contract?.contract_data?.decimals || 18, // TODO: fix this
          }
        })
        const repared = converted.map(async (transfer) => {
          if (transfer.to !== 'deleted' && transfer.from !== 'deleted') {
            return transfer
          }
          const res = await axiosInstance.post('', {
            query: GET_TRANSFER_EXTRINSIC_EVENTS,
            variables: {
              exId: transfer.extrinsicId,
            },
          })
          if (
            res.data &&
            res.data.extrinsic.length > 0 &&
            res.data.extrinsic[0].events &&
            res.data.extrinsic[0].events.length > 0 &&
            res.data.extrinsic[0].events[0].data
          ) {
            const [to, from] = res.data.extrinsic[0].events[0].data
            return { ...transfer, to, from }
          }
          return transfer
        })
        this.transfers = await Promise.all(repared)
        this.totalRows = this.filter ? this.transfers.length : this.nTransfers
        this.nTransfers = totalTxResponse.data.data.totalTransfers[0].count
        this.totalRows = this.nTransfers
        if (!this.forceLoad) this.loading = false
      } catch (error) {
        console.log(error)
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
