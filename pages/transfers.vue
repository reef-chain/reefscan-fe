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
          <Table v-else>
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
                formatShortAmount(item.amount, item.symbol, item.decimals)
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
import ReefIdenticon from '@/components/ReefIdenticon.vue'
import { paginationOptions } from '@/frontend.config.js'

const GET_TRANSFER_EXTRINSIC_EVENTS = gql`
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
    }
  },
  apollo: {
    $subscribe: {
      extrinsic: {
        query: gql`
          subscription transfer(
            $perPage: Int!
            $offset: Int!
            $where: TransferWhereInput
          ) {
            transfers(
              limit: $perPage
              orderBy: timestamp_DESC
              offset: $offset
              where: $where
            ) {
              to {
                id
                evmAddress
              }
              token {
                id
              }
              from {
                id
                evmAddress
              }
              extrinsic {
                id
                hash
                index
                block {
                  height
                }
                args
                status
                errorMessage
              }
              id
              amount
              timestamp
              denom
            }
          }
        `,
        variables() {
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
            perPage: this.perPage,
            offset: (this.currentPage - 1) * this.perPage,
          }
        },
        async result({ data }) {
          const converted = data.transfers.map((transfer) => {
            return {
              amount: transfer.amount,
              success: transfer.extrinsic.status === 'success',
              timestamp: transfer.timestamp,
              hash: transfer.extrinsic.hash,
              idx: transfer.extrinsic.index,
              extrinsicId: transfer.extrinsic.id,
              index: parseInt(transfer.id.split('-')[1]),
              block_id: transfer.extrinsic.block.height,
              to:
                transfer.to.id === null
                  ? transfer.to.evmAddress
                  : transfer.to.id,
              from:
                transfer.from.id === null
                  ? transfer.from.evmAddress
                  : transfer.from.id,
              symbol:
                transfer.token.verified_contract?.contract_data?.symbol || ' ', // TODO: fix this
              decimals:
                transfer.token.verified_contract?.contract_data?.decimals || 18, // TODO: fix this
            }
          })
          const repared = converted.map(async (transfer) => {
            if (transfer.to !== 'deleted' && transfer.from !== 'deleted') {
              return transfer
            }
            const res = await this.$apollo.provider.defaultClient.query({
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
          this.loading = false
        },
      },
      totalTransfers: {
        query: gql`
          subscription total {
            chainInfos(where: { id_eq: "transfers" }) {
              count
            }
          }
        `,
        result({ data }) {
          this.nTransfers = data.chainInfos[0].count
          this.totalRows = this.nTransfers
        },
      },
    },
  },
}
</script>
