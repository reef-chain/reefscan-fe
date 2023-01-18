<template>
  <div>
    <section>
      <b-container class="transfer-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <NotFound v-else-if="!transfer" text="Transfer not found" />
        <Transfer v-else :transfer="transfer" />
      </b-container>
    </section>
  </div>
</template>
<script>
import { gql } from 'graphql-tag'
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'

export default {
  components: {
    Loading,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      blockHeight: this.$route.params.block,
      extrinsicIndex: this.$route.params.index,
      eventIndex: this.$route.params.event,
      transfer: undefined,
    }
  },
  head() {
    return {
      title: 'Explorer | Reef Network',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Reef Chain is an EVM compatible chain for DeFi',
        },
      ],
    }
  },
  watch: {
    $route() {
      this.blockHeight = this.$route.params.block
      this.extrinsicIndex = this.$route.params.index
      this.eventIndex = this.$route.params.event
    },
  },
  apollo: {
    transfers: {
      query: gql`
        query transfers($block: Int!, $index: Int!) {
          transfers(
            where: {
              extrinsic: { index_eq: $index, block: { height_eq: $block } }
            }
            limit: 10
          ) {
            amount
            denom
            block {
              height
            }
            to {
              id
              evmAddress
            }
            from {
              id
              evmAddress
            }
            timestamp
            extrinsic {
              id
              hash
              index
              errorMessage
              status
              events(where: { method_eq: "Transfer" }, limit: 50) {
                data
                extrinsic {
                  id
                }
                index
              }
            }
            token {
              id
              contractData
            }
            feeAmount
          }
        }
      `,
      skip() {
        return !this.blockHeight || !this.extrinsicIndex
      },
      variables() {
        // return {
        //   hash: this.hash,
        // }
        return {
          block: this.blockHeight,
          index: this.extrinsicIndex,
        }
      },
      result({ data }) {
        if (data && data.transfers) {
          this.transfer = data.transfers.find(
            (transfer) => transfer.extrinsic.events[0].index === this.eventIndex
          )
          this.transfer.to_address =
            this.transfer.to.id || this.transfer.to.evmAddress
          this.transfer.block_id = this.transfer.block.height
          this.transfer.extrinsic.error_message =
            this.transfer.extrinsic.errorMessage

          this.transfer.extrinsic.events = this.transfer.extrinsic.events.map(
            (event) => {
              event.extrinsic_id = event.extrinsic.id
              return event
            }
          )

          this.transfer.fee_amount = this.transfer.feeAmount

          this.transfer.success =
            data.transfers[0].extrinsic.status === 'success'

          if (this.transfer.to_address === 'deleted') {
            this.transfer.to_address =
              data.transfers[0].extrinsic.events[0].data[1]
          }

          this.transfer.from_address =
            this.transfer.from.id || this.transfer.from.evmAddress
          if (this.transfer.from_address === 'deleted') {
            this.transfer.from_address =
              data.transfer[0].extrinsic.events[0].data[0]
          }

          // TODO: update when we have token data in the contract table
          this.transfer.token_address = this.transfer.token.id
          if (this.transfer.token && this.transfer.token.contractData) {
            this.transfer.tokenName = this.transfer.token.contractData.name
            this.transfer.symbol = this.transfer.token.contractData.symbol
            this.transfer.decimals = this.transfer.token.contractData.decimals
          }
        }
        this.loading = false
      },
    },
  },
}
</script>
