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
      hash: this.$route.params.hash,
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
      this.hash = this.$route.params.hash
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
            query transfers($hash: String!,$blockHash:String!) {
              transfers(where: { extrinsicHash_containsInsensitive : $hash, AND: {blockHash_startsWith: $blockHash}},
              limit: 1) {
                amount
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
                blockHash
                timestamp
                extrinsicId
                extrinsicIndex
                extrinsicHash
                eventIndex
                success
                errorMessage
                signedData
                denom
                token {
                  id
                  contractData
                }
              }
            }
          `,
          variables: {
            hash: this.hash.split('-')[0],
            blockHash: `0x${this.hash.split('-')[1]}`,
          },
        })

        const data = response.data.data
        if (data && data.transfers) {
          this.transfer = data.transfers[0]
          this.transfer.to_address =
            this.transfer.to.id || this.transfer.to.evmAddress
          this.transfer.block_id = this.transfer.blockHeight
          this.transfer.extrinsic = {}
          this.transfer.extrinsic.hash = this.toExtrinsicIdent(
            this.transfer.extrinsicHash,
            this.transfer.blockHash
          )
          this.transfer.extrinsic.index = this.transfer.extrinsicIndex
          this.transfer.extrinsic.error_message = this.transfer.errorMessage
          this.transfer.isNft = this.transfer.nftId !== null
          this.transfer.fee_amount = this.transfer.signedData.fee.partialFee
          this.transfer.success = data.transfers[0].success

          if (this.transfer.to_address === 'deleted') {
            this.transfer.to_address =
              data.transfers[0].extrinsic.events[0].data[1]
          }

          this.transfer.from_address =
            this.transfer.from.id || this.transfer.from.evmAddress
          if (this.transfer.from_address === 'deleted') {
            const response = await axiosInstance.post('', {
              query: `query EventsData {
                events(where: {extrinsic: {hash_eq: "${this.transfer.extrinsic.hash}", id_eq: "${this.transfer.extrinsic.index}"}, block: {height_eq: ${this.transfer.block_id}}, method_eq: "Transfer"}, limit: 1) {
                  data
                }
              }`,
            })
            this.transfer.from_address = response.data.data.events[0].data[0]
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
