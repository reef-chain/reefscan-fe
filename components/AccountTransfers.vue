<template>
  <div class="account-transfers list-view">
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <div v-else-if="transfers.length === 0" class="text-center py-4">
      <h5>{{ $t('components.transfers.no_transfer_found') }}</h5>
    </div>
    <div v-else>
      <div class="list-view__table-head">
        <Input
          v-model="filter"
          :placeholder="$t('components.transfers.search')"
        />
        <JsonCSV
          :data="transfers"
          class="list-view__download-btn"
          :name="`reef_transfers_${accountId}.csv`"
        >
          <font-awesome-icon icon="file-csv" />
          <span>{{ $t('pages.accounts.download_csv') }}</span>
        </JsonCSV>
      </div>
      <Table>
        <THead>
          <Cell width="10" />
          <Cell :sortable="['extrinsic_hash', activeSort]">Hash</Cell>
          <Cell :sortable="['block_id', activeSort]">Block</Cell>
          <Cell :sortable="['timestamp', activeSort, true]">Date</Cell>
          <Cell :sortable="['from_address', activeSort]">From</Cell>
          <Cell :sortable="['to_address', activeSort]">To</Cell>
          <Cell :sortable="['amount', activeSort]" align="right">Amount</Cell>
          <Cell :sortable="['fee_amount', activeSort]" align="right">Fee</Cell>
          <Cell :sortable="['success', activeSort]" align="center" width="10"
            >Success</Cell
          >
        </THead>

        <Row v-for="(item, index) in list" :key="index">
          <Cell
            align="center"
            class="account-transfers__indicator"
            :class="{
              'account-transfers__indicator--reverse':
                item.from_address !== accountId,
            }"
          >
            <font-awesome-icon :icon="['fas', 'arrow-up']" />
          </Cell>

          <Cell
            :link="`/transfer/${item.block_id}/${item.extrinsic_index}/${item.event_index}`"
            >{{ shortHash(item.extrinsic_hash) }}</Cell
          >

          <Cell :link="`/block?blockNumber=${item.block_id}`"
            ># {{ formatNumber(item.block_id) }}</Cell
          >

          <Cell class="list-view__age">
            <font-awesome-icon :icon="['far', 'clock']" />
            <span>{{ fromNow(item.timestamp) }}</span>
          </Cell>

          <Cell
            :link="{ url: `/account/${item.from_address}`, fill: false }"
            :title="$t('pages.accounts.account_details')"
          >
            <ReefIdenticon
              :key="item.from_address"
              :address="item.from_address"
              :size="20"
            />
            <span>
              {{ shortAddress(item.from_address) }}
            </span>
          </Cell>

          <Cell
            :link="{ url: `/account/${item.to_address}`, fill: false }"
            :title="$t('pages.accounts.account_details')"
          >
            <ReefIdenticon
              :key="item.to_address"
              :address="item.to_address"
              :size="20"
            />
            <span>
              {{ shortAddress(item.to_address) }}
            </span>
          </Cell>

          <Cell align="right">{{
            item.isNft
              ? formatNftTransfer(item.amount)
              : formatShortAmount(item.amount, item.symbol, item.decimals)
          }}</Cell>

          <Cell align="right">{{ formatShortAmount(item.fee_amount) }}</Cell>

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

      <div class="list-view__pagination">
        <PerPage v-model="perPage" />
        <b-pagination
          v-model="currentPage"
          :total-rows="totalRows"
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
import ReefIdenticon from '@/components/ReefIdenticon.vue'
import Loading from '@/components/Loading.vue'
import { paginationOptions } from '@/frontend.config.js'
import Input from '@/components/Input'
import tableUtils from '@/mixins/tableUtils'
import axiosInstance from '~/utils/axios'
import ObsPolling from '~/utils/obsPolling'

const FIRST_BATCH_QUERY = `
  query transfers($accountId: String!, $first: Int!) {
    transfers: transfersConnection(
      orderBy: blockHeight_DESC
      where: {
        OR: [{ to: { id_eq: $accountId } }, { from: { id_eq: $accountId } }]
      }
      first: $first
    ) {
      edges {
        node {
          nftId
          blockHeight
          eventIndex
          extrinsicIndex
          extrinsicHash
          success
          signedData
          to {
            id
            evmAddress
          }
          from {
            id
            evmAddress
          }
          amount
          token {
            id
            contractData
          }
          errorMessage
          timestamp
        }
      }
      totalCount
    }
  }
`

const NEXT_BATCH_QUERY = `
  query transfers($accountId: String!, $after: String!, $first: Int!) {
    transfers: transfersConnection(
      orderBy: blockHeight_DESC
      where: {
        OR: [{ to: { id_eq: $accountId } }, { from: { id_eq: $accountId } }]
      }
      after: $after
      first: $first
    ) {
      edges {
        node {
          nftId
          blockHeight
          eventIndex
          extrinsicIndex
          extrinsicHash
          success
          signedData
          to {
            id
            evmAddress
          }
          from {
            id
            evmAddress
          }
          amount
          token {
            id
            contractData
          }
          errorMessage
          timestamp
        }
      }
      totalCount
    }
  }
`

export default {
  components: {
    ReefIdenticon,
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
      transfers: [],
      filter: null,
      filterOn: [],
      tableOptions: paginationOptions,
      perPage: paginationOptions[0],
      currentPage: 1,
      totalRows: 1,
      callbackId: null,
      previousPage: null,
    }
  },
  computed: {
    searchResults() {
      const list = this.transfers || []
      if (!this.filter) return list

      return list.filter((item) => {
        const filter = this.filter.toLowerCase()
        const hash = item.extrinsic.hash
          ? item.extrinsic.hash.toLowerCase()
          : ''
        const block = item.block_id ? String(item.block_id).toLowerCase() : ''
        const from = item.from_address ? item.from_address.toLowerCase() : ''
        const to = item.to_address ? item.to_address.toLowerCase() : ''
        return (
          hash.includes(filter) ||
          block.includes(filter) ||
          from.includes(filter) ||
          to.includes(filter)
        )
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
    setPerPage(value) {
      this.perPage = value
    },
    async updateData() {
      try {
        const queries = []
        const firstQuery = {
          query: FIRST_BATCH_QUERY,
          variables: {
            accountId: this.accountId,
            first: Math.min(this.perPage, 50),
          },
        }

        queries.push(axiosInstance.post('', firstQuery))

        if (this.perPage > 50) {
          const secondQuery = {
            query: NEXT_BATCH_QUERY,
            variables: {
              accountId: this.accountId,
              first: this.perPage - 50,
              after: '50',
            },
          }
          queries.push(axiosInstance.post('', secondQuery))
        }

        const results = await Promise.all(queries)
        const edges = results.flatMap(
          (res) => res.data?.data?.transfers?.edges || []
        )
        const totalCount = results[0]?.data?.data?.transfers?.totalCount || 0

        this.transfers = edges.map((t) => {
          const node = t.node
          return {
            ...node,
            block_id: node.blockHeight,
            extrinsic_hash: node.extrinsicHash,
            extrinsic_index: node.extrinsicIndex,
            success: node.success,
            to_address: node.to?.id || node.to?.evmAddress,
            from_address: node.from?.id || node.from?.evmAddress,
            token_address: node.token?.id,
            isNft: node.nftId !== null,
            fee_amount: node.signedData?.fee?.partialFee,
            error_message: node.errorMessage,
            event_index: node.eventIndex,
            symbol: node.token?.contractData?.symbol,
            decimals: node.token?.contractData?.decimals,
          }
        })

        this.totalRows = this.filter ? this.transfers.length : totalCount
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
  },
}
</script>

<style lang="scss">
.account-transfers {
  .account-transfers__indicator {
    .table-cell__content-wrapper {
      padding-left: 14px;
    }

    svg {
      font-size: 16px;
      transform: rotate(45deg);
      color: #8792a8;
    }

    &--reverse {
      svg {
        transform: rotate(-135deg);
        color: #14be7d;
      }
    }
  }
}
</style>
