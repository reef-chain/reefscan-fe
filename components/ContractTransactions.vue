<template>
  <div class="contract-executions list-view">
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <div v-else-if="transactions.length === 0" class="text-center py-4">
      <h5>
        {{ $t('components.contract_transactions.no_transactions_found') }}
      </h5>
    </div>
    <div v-else>
      <Table>
        <THead>
          <Cell>Transaction</Cell>
          <Cell>Block</Cell>
          <Cell>Extrinsic</Cell>
          <Cell>Age</Cell>
          <Cell align="center">Success</Cell>
        </THead>

        <Row v-for="(item, index) in transactions" :key="index">
          <Cell :link="`/contract/tx/${item.block_id}/${item.index}`">{{
            shortHash(item.hash)
          }}</Cell>

          <Cell :link="`/block?blockNumber=${item.block_id}`"
            ># {{ formatNumber(item.block_id) }}</Cell
          >

          <Cell :link="`/extrinsic/${item.block_id}/${item.index}`">
            #{{ formatNumber(item.block_id) }}-{{ formatNumber(item.index) }}
          </Cell>

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
              v-if="item.status === 'Success'"
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
import commonMixin from '@/mixins/commonMixin.js'
import axiosInstance from '~/utils/axios'
import ObsPolling from '~/utils/obsPolling'

const FIRST_BATCH_QUERY = `
  query evm_event_qry($contractAddress: String!, $first: Int!) {
    transactions: evmEventsConnection(
      first: $first
      where: { contractAddress_containsInsensitive: $contractAddress }
      orderBy: blockHeight_DESC
    ) {
      edges {
        node {
          blockHeight
          extrinsicIndex
          eventIndex
          status
        }
      }
    }
  }
`
// event {
//             extrinsic {
//               id
//               hash
//               timestamp
//             }
//           }

const NEXT_BATCH_QUERY = `
  query evm_event_qry(
    $contractAddress: String!
    $first: Int!
    $after: String!
  ) {
    transactions: evmEventsConnection(
      first: $first
      after: $after
      where: { contractAddress_containsInsensitive: $contractAddress }
      orderBy: timestamp_DESC
    ) {
      edges {
        node {
          blockHeight
          extrinsicIndex
          eventIndex
          status
        }
      }
    }
  }
`

export default {
  mixins: [commonMixin],
  props: {
    contractId: {
      type: String,
      default: () => '',
    },
  },
  data() {
    return {
      loading: true,
      transactions: [],
      currentPage: 1,
      totalRows: 1,
      perPage: 20,
      callbackId: null,
    }
  },
  created() {
    this.updateData()
    ObsPolling.addCallback(
      nw.getLatestBlockContractEvents$([
        this.toContractAddress(this.contractId),
      ]),
      this.updateData
    )
  },
  destroyed() {
    ObsPolling.removeCallback(this.updateData)
  },
  methods: {
    async getExtrinsicHash(blockHeight, extrinsicIndex, eventIndex) {
      try {
        const extrinsicHashResponse = await axiosInstance.post('', {
          query: `
            query extrinsicsHash {
              extrinsics(
                where: {
                  block: {height_eq: ${blockHeight}},
                  events_some: {index_eq: ${eventIndex}},
                  index_eq: ${extrinsicIndex}
                }
                limit: 1
              ) {
                hash
                timestamp
              }
            }
          `,
        })
        const extrinsicHash = extrinsicHashResponse.data.data.extrinsics[0].hash
        const timestamp =
          extrinsicHashResponse.data.data.extrinsics[0].timestamp
        return { extrinsicHash, timestamp }
      } catch (error) {
        return { extrinsicHash: '', timestamp: '' }
      }
    },
    async getExtrinsicHashes(transfers) {
      const hashes = {}
      await Promise.all(
        transfers.map(async (t) => {
          const hash = await this.getExtrinsicHash(
            t.blockHeight,
            t.extrinsicIndex,
            t.eventIndex
          )
          hashes[`${t.blockHeight}-${t.extrinsicIndex}-${t.eventIndex}`] = hash
        })
      )
      return hashes
    },
    async updateData() {
      // transactions query
      try {
        const transactionsQueryResponse = await axiosInstance.post('', {
          query: this.currentPage === 1 ? FIRST_BATCH_QUERY : NEXT_BATCH_QUERY,
          variables: {
            contractAddress: this.toContractAddress(this.contractId),
            first: this.perPage,
            after: ((this.currentPage - 1) * this.perPage + 1).toString(),
          },
        })
        if (transactionsQueryResponse.data.data) {
          const data = transactionsQueryResponse.data.data

          const dataArr = []
          if (data.transactions.edges) {
            for (let idx = 0; idx < data.transactions.edges.length; idx++) {
              dataArr.push(data.transactions.edges[idx].node)
            }
            data.transactions = dataArr
            this.transactions = dataArr
          }
          const hashes = await this.getExtrinsicHashes(data.transactions)
          if (data) {
            this.transactions = data.transactions.map((t) => ({
              block_id: t.blockHeight,
              index: t.extrinsicIndex,
              status: t.status,
              hash: hashes[
                `${t.blockHeight}-${t.extrinsicIndex}-${t.eventIndex}`
              ].extrinsicHash,
              timestamp:
                hashes[`${t.blockHeight}-${t.extrinsicIndex}-${t.eventIndex}`]
                  .timestamp,
            }))
          }
          this.loading = false
        }
      } catch (error) {
        this.setPerPage(20)
        this.$bvToast.toast(`Exceeds the size limit`, {
          title: 'Encountered an Error',
          variant: 'danger',
          autoHideDelay: 5000,
          appendToast: false,
        })
      }
      // total transactions query
      const totalTransactionsResponse = await axiosInstance.post('', {
        query: `
          query evm_event_count_aggregation {
            total_transactions: chainInfos(where: { id_eq: "contracts" }) {
              count
            }
          }
        `,
      })
      if (totalTransactionsResponse.data.data) this.totalRows = 1
    },
    setPerPage(value) {
      this.perPage = value
    },
  },
}
</script>

<style>
.contract-executions .table th,
.contract-executions .table td {
  padding: 0.45rem;
}
.contract-executions .table thead th {
  border-bottom: 0;
}
.contract-executions .identicon {
  display: inline-block;
  margin: 0 0.2rem 0 0;
  cursor: copy;
}
</style>
