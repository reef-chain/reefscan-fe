<template>
  <div class="last-transfers">
    <div class="headline">
      <nuxt-link
        v-b-tooltip.hover
        :to="`/transfers`"
        title="Click to see last transfers"
      >
        Last Transfers
      </nuxt-link>
    </div>
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <Table v-else>
      <THead>
        <Cell>Transfer</Cell>
        <Cell>Token</Cell>
        <Cell>From</Cell>
        <Cell>To</Cell>
        <Cell>Amount</Cell>
        <Cell>Success</Cell>
      </THead>
      <Row v-for="(item, index) in transfers" :key="'item-' + index">
        <Cell
          :link="`/transfer/${item.height}/${item.index}/${item.eventIndex}`"
          >{{ shortHash(item.hash) }}</Cell
        >

        <Cell
          :link="{ url: `/token/${item.tokenAddress}`, fill: false }"
          :title="$t('pages.accounts.account_details')"
        >
          <ReefIdenticon
            :key="item.tokenAddress"
            :address="item.tokenAddress"
            :size="20"
          />
          <span>{{ shortAddress(item.tokenAddress) }}</span>
        </Cell>

        <Cell
          :link="{ url: `/account/${item.from}`, fill: false }"
          :title="$t('pages.accounts.account_details')"
        >
          <ReefIdenticon :key="item.from" :address="item.from" :size="20" />
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

        <Cell>
          {{
            item.isNft
              ? formatNftTransfer(item.amount)
              : formatShortAmount(item.amount, item.symbol, item.decimals)
          }}
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
  </div>
</template>

<script>
import { network as nw } from '@reef-chain/util-lib'
import commonMixin from '@/mixins/commonMixin.js'
import ReefIdenticon from '@/components/ReefIdenticon.vue'
// import { network } from '@/frontend.config'
import Loading from '@/components/Loading.vue'
import ObsPolling from '~/utils/obsPolling'
import axiosInstance from '~/utils/axios'

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

export default {
  components: {
    ReefIdenticon,
    Loading,
  },
  mixins: [commonMixin],
  data() {
    return {
      transfers: [],
      loading: true,
      callbackId: null,
    }
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
        // TODO: broken until we have a way to get the token info
        const response = await axiosInstance.post('', {
          query: `
            query transfer {
              lastTransfers: transfersConnection(
                first: 10
                orderBy: timestamp_DESC
              ) {
                edges {
                  node {
                    nftId
                    eventIndex
                    extrinsicId
                    extrinsicHash
                    extrinsicIndex
                    blockHeight
                    from {
                      id
                      evmAddress
                    }
                    to {
                      id
                      evmAddress
                    }
                    token {
                      id
                    }
                    success
                    amount
                    timestamp
                  }
                }
              }
            }
          `,
        })
        const data = response.data.data
        const dataArr = []
        if (data.lastTransfers.edges) {
          for (let idx = 0; idx < data.lastTransfers.edges.length; idx++) {
            dataArr.push(data.lastTransfers.edges[idx].node)
          }
          data.lastTransfers = dataArr
          this.lastTransfers = dataArr
        }
        const processed = data.lastTransfers.map((transfer) => ({
          amount: transfer.amount,
          success: transfer.success,
          hash: transfer.extrinsicHash,
          height: transfer.blockHeight,
          index: transfer.extrinsicIndex,
          timestamp: transfer.timestamp,
          tokenAddress: transfer.token.id,
          isNft: transfer.nftId !== null,
          symbol:
            transfer.token.verified_contract?.contract_data?.symbol || ' ',
          decimals:
            transfer.token.verified_contract?.contract_data?.decimals || 18,
          to: transfer.to !== null ? transfer.to.id : transfer.to.evmAddress,
          from:
            transfer.from !== null
              ? transfer.from.id
              : transfer.from.evmAddress,
          extrinsicId: transfer.extrinsicId,
          eventIndex: transfer.eventIndex,
        }))
        const repaird = processed.map(async (transfer) => {
          if (transfer.to !== 'deleted' && transfer.from !== 'deleted') {
            return transfer
          }
          const res = (
            await axiosInstance.post('', {
              query: GET_TRANSFER_EXTRINSIC_EVENTS,
              variables: {
                exId: transfer.extrinsicId,
              },
            })
          ).data
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
        this.transfers = await Promise.all(repaird)
        this.loading = false
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

<style lang="scss">
.last-transfers .table th,
.last-transfers .table td {
  padding: 0.45rem;
}
.last-transfers .table thead th {
  border-bottom: 0;
}

* + .last-transfers {
  margin-top: 50px;
}
</style>
