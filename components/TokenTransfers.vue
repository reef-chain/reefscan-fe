<template>
  <div class="token-transfers list-view">
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <div v-else-if="transfers.length === 0" class="text-center py-4">
      <h5>No transfers found</h5>
    </div>
    <div v-else>
      <Table>
        <THead>
          <Cell>Transfer</Cell>
          <Cell>Extrinsic</Cell>
          <Cell>From address</Cell>
          <Cell>To address</Cell>
          <Cell>Amount</Cell>
          <Cell>Age</Cell>
          <Cell align="center">Success</Cell>
        </THead>

        <Row v-for="(item, index) in list" :key="index">
          <Cell
            :link="`/contract/tx/${item.extrinsic.block_id}/${item.extrinsic.index}`"
          >
            {{ shortHash(item.extrinsic.hash) }}
          </Cell>

          <Cell
            :link="`/extrinsic/${item.extrinsic.block_id}/${item.extrinsic.index}`"
          >
            #{{ formatNumber(item.extrinsic.block_id) }}-{{
              formatNumber(item.extrinsic.index)
            }}
          </Cell>

          <Cell
            :link="{ url: `/account/${item.from_address}`, fill: false }"
            :title="$t('pages.accounts.account_details')"
          >
            <ReefIdenticon
              :key="item.extrinsic.signer"
              :address="item.from_address"
              :size="20"
            />
            <span>
              {{ shortAddress(item.from_address || item.from_evm_address) }}
            </span>
          </Cell>

          <Cell
            :link="{ url: `/account/${item.to_address}`, fill: false }"
            :title="$t('pages.accounts.account_details')"
          >
            <ReefIdenticon
              :key="item.extrinsic.signer"
              :address="item.to_address"
              :size="20"
            />
            <span>
              {{ shortAddress(item.to_address || item.to_evm_address) }}
            </span>
          </Cell>

          <Cell>{{
            item.isNft
              ? formatNftTransfer(item.amount)
              : formatAmount(item.amount, symbol, decimals)
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
              v-if="item.extrinsic.status"
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
          :total-rows="transfers.length"
          :per-page="perPage"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { network as nw } from '@reef-chain/util-lib'
import commonMixin from '@/mixins/commonMixin.js'
import Loading from '@/components/Loading.vue'
import { paginationOptions } from '@/frontend.config.js'
import tableUtils from '@/mixins/tableUtils'
import axiosInstance from '~/utils/axios'
import ObsPolling from '~/utils/obsPolling'

export default {
  components: {
    Loading,
  },
  mixins: [commonMixin, tableUtils],
  props: {
    tokenId: { type: String, required: true },
    decimals: { type: Number, default: 0 },
    symbol: { type: String, default: '' },
  },
  data() {
    return {
      loading: true,
      transfers: [],
      tableOptions: paginationOptions,
      perPage: null,
      currentPage: 1,
      totalRows: 1,
      activeSort: {
        property: 'timestamp',
        descending: true,
      },
      callbackId: null,
    }
  },
  computed: {
    list() {
      return this.paginate(
        this.sort(this.transfers),
        this.perPage,
        this.currentPage
      )
    },
  },
  created() {
    this.updateData()
    ObsPolling.addCallback(
      nw.getLatestBlockContractEvents$([this.tokenId]),
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
              }
            }
          `,
        })
        const extrinsicHash = extrinsicHashResponse.data.data.extrinsics[0].hash
        return { extrinsicHash }
      } catch (error) {
        return { extrinsicHash: '' }
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
      const TRANSFERS_QUERY = `
        query transfer($tokenId: String!) {
          transfers(
            orderBy: timestamp_DESC
            where: { token: { id_eq: $tokenId } }
            limit: 60
          ) {
            nftId
            to {
              id
              evmAddress
            }
            from {
              id
              evmAddress
            }
            amount
            success
            timestamp
            blockHeight
            extrinsicIndex
            eventIndex
          }
        }
      `
      try {
        const response = await axiosInstance.post('', {
          query: TRANSFERS_QUERY,
          variables: {
            tokenId: this.tokenId,
          },
        })
        const data = await response.data.data
        const hashes = await this.getExtrinsicHashes(data.transfers)
        this.transfers = data.transfers.map((transfer) => {
          return {
            ...transfer,
            to_address: transfer.to.id,
            isNft: transfer.nftId,
            from_address: transfer.from.id,
            to_evm_address: transfer.to.evmAddress,
            from_evm_address: transfer.from.evmAddress,
            extrinsic: {
              hash: hashes[
                `${transfer.blockHeight}-${transfer.extrinsicIndex}-${transfer.eventIndex}`
              ].extrinsicHash,
              index: transfer.extrinsicIndex,
              status: transfer.success,
              block_id: transfer.blockHeight,
            },
          }
        })
        this.totalRows = this.transfers.length
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
