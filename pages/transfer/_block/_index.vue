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
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'
import axiosInstance from '~/utils/axios'

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
  created() {
    this.updateData()
  },
  methods: {
    async updateData() {
      try {
        const response = await axiosInstance.post('', {
          query: `
            query transfers($block: Int!, $index: Int!, $eventIndex: Int!) {
              transfers(
                where: {
                  extrinsicIndex_eq: $index,
                  blockHeight_eq: $block,
                  eventIndex_eq: $eventIndex 
                }
                limit: 1
              ) {
                amount
                denom
                nftId
                blockHeight
                to {
                  id
                  evmAddress
                }
                from {
                  id
                  evmAddress
                }
                timestamp
                extrinsicId
                extrinsicIndex
                extrinsicHash
                errorMessage
                success
                signedData
                eventIndex
                token {
                  id
                  contractData
                }
              }
            }
          `,
          variables: {
            block: parseInt(this.blockHeight),
            index: parseInt(this.extrinsicIndex),
            eventIndex: parseInt(this.eventIndex),
          },
        })

        const data = response.data.data
        if (data && data.transfers) {
          this.transfer = data.transfers[0]
          this.transfer.to_address =
            this.transfer.to.id || this.transfer.to.evmAddress
          this.transfer.block_id = this.transfer.blockHeight
          this.transfer.extrinsic = {}
          this.transfer.extrinsic.error_message = this.transfer.errorMessage
          this.transfer.fee_amount = this.transfer.signedData.fee.partialFee
          this.transfer.extrinsic.hash = this.transfer.extrinsicHash
          this.transfer.extrinsic.index = this.transfer.extrinsicIndex
          this.transfer.success = data.transfers[0].success
          this.transfer.isNft = this.transfer.nftId !== null
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
      } catch (error) {}
    },
  },
}
</script>
