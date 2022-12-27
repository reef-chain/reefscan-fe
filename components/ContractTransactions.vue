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
          <Cell>Timestamp</Cell>
          <Cell align="center">Success</Cell>
        </THead>

        <Row v-for="(item, index) in transactions" :key="index">
          <Cell :link="`/contract/tx/${item.hash}`">{{
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
              v-if="item.status === 'success'"
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
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'

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
    }
  },
  apollo: {
    $subscribe: {
      transactions: {
        // query: gql`
        //   subscription evm_event_qry(
        //     $contractAddress: String_comparison_exp = {}
        //     $perPage: Int!
        //     $offset: Int!
        //   ) {
        //     evm_event(
        //       limit: $perPage
        //       offset: $offset
        //       where: { contract_address: $contractAddress }
        //       order_by: [
        //         { block_id: desc }
        //         { extrinsic_index: desc }
        //         { event_index: desc }
        //       ]
        //     ) {
        //       event {
        //         extrinsic {
        //           id
        //           hash
        //           block_id
        //           index
        //           timestamp
        //           status
        //         }
        //       }
        //     }
        //   }
        // `,
        query: gql`
          subscription evm_event_qry(
            $contractAddress: String!
            $perPage: Int!
            $offset: Int!
          ) {
            evmEvents(
              limit: $perPage
              offset: $offset
              where: { contractAddress_containsInsensitive: $contractAddress }
              orderBy: block_id_DESC
            ) {
              event {
                extrinsic {
                  id
                  hash
                  block {
                    height
                  }
                  index
                  timestamp
                  status
                }
              }
            }
          }
        `,
        variables() {
          return {
            contractAddress: this.toContractAddress(this.contractId),
            perPage: this.perPage,
            offset: (this.currentPage - 1) * this.perPage,
          }
        },
        result({ data }) {
          if (data) {
            this.transactions = data.evmEvents.reduce((state, curr) => {
              curr.event.extrinsic.block_id = curr.event.extrinsic.block.height
              state.push(curr.event.extrinsic)
              return state
            }, [])
          }
          this.loading = false
        },
      },
      // TODO: needs to be implemented in the backend
      total_transactions: {
        // query: gql`
        //   subscription evm_event_count_aggregation(
        //     $contractAddress: String_comparison_exp = {}
        //   ) {
        //     evm_event_aggregate(where: { contract_address: $contractAddress }) {
        //       aggregate {
        //         count
        //       }
        //     }
        //   }
        // `,
        // this is purely for having some kind of call
        query: gql`
          subscription evm_event_count_aggregation {
            chainInfos(where: { id_eq: "contracts" }) {
              count
            }
          }
        `,
        variables() {
          // return {
          //   contractAddress: {
          //     _ilike: this.toContractAddress(this.contractId),
          //   },
          // }
          return {}
        },
        result({ data }) {
          // this.totalRows = data.evm_event_aggregate.aggregate.count
          // TODO: needs to be implemented in the backend
          this.totalRows = 1
          console.log(this.totalRows)
        },
      },
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
