<template>
  <div>
    <section>
      <b-container class="extrinsic-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <NotFound v-else-if="!parsedExtrinsic" text="Extrinsic not found" />
        <Extrinsic v-else :extrinsic="parsedExtrinsic" />
      </b-container>
    </section>
  </div>
</template>

<script>
import Loading from '@/components/Loading.vue'
import Extrinsic from '@/components/Extrinsic.vue'
import commonMixin from '@/mixins/commonMixin.js'
import axiosInstance from '~/utils/axios'

export default {
  components: {
    Loading,
    Extrinsic,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      blockNumber: Number(this.$route.params.block),
      extrinsicIdentifier: this.$route.params.index,
      isExtrinsicHash: this.$route.params.index.startsWith('0x'),
      parsedExtrinsic: undefined,
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
      this.blockNumber = Number(this.$route.params.block)
      this.extrinsicIdentifier = this.$route.params.index
      this.isExtrinsicHash = this.$route.params.index.startsWith('0x')
      this.updateData()
    },
  },
  created() {
    this.updateData()
  },
  methods: {
    async updateData() {
      try {
        const response = await axiosInstance.post('', {
          query: this.isExtrinsicHash
            ? `
              query extrinsics($block_height: Int!, $extrinsicIdentifier: String!) {
                extrinsics(
                  where: {
                    block: { height_eq: $block_height }
                    hash_eq: $extrinsicIdentifier
                  }
                  limit: 1
                ) {
                  id
                  block {
                    height
                  }
                  index
                  signer
                  section
                  method
                  args
                  hash
                  docs
                  type
                  timestamp
                  errorMessage
                  signedData
                }
              }
            `
            : `
              query extrinsics($block_height: Int!, $extrinsicIdentifier: Int!) {
                extrinsics(
                  where: {
                    block: { height_eq: $block_height }
                    index_eq: $extrinsicIdentifier
                  }
                  limit: 1
                ) {
                  id
                  block {
                    height
                  }
                  index
                  signer
                  section
                  method
                  args
                  hash
                  docs
                  type
                  timestamp
                  errorMessage
                  signedData
                }
              }
            `,
          variables: {
            block_height: this.blockNumber,
            extrinsicIdentifier: this.isExtrinsicHash
              ? this.extrinsicIdentifier
              : Number(this.extrinsicIdentifier),
          },
        })

        const data = response.data.data
        if (data.extrinsics[0]) {
          this.parsedExtrinsic = data.extrinsics[0]
          this.parsedExtrinsic.block_id = this.parsedExtrinsic.block.height
          this.parsedExtrinsic.error_message = this.parsedExtrinsic.errorMessage
          this.parsedExtrinsic.signed_data = this.parsedExtrinsic.signedData
        }

        this.loading = false
      } catch (error) {}
    },
  },
}
</script>
