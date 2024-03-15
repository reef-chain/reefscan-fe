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
      extHash: this.$route.params.hash,
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
      this.extHash = this.$route.params.hash
      this.updateData()
    },
  },
  created() {
    this.updateData()
  },
  methods: {
    async updateData() {
      try {
        let isBlockNum = false
        if (this.extHash) {
          isBlockNum = this.isBlockNumber(this.extHash.split('-')[1])
        }
        let response
        if (isBlockNum) {
          response = await axiosInstance.post('', {
            query: `
          query extrinsics($hash: String!, $height: Int!) {
            extrinsics(where: { hash_contains: $hash, AND: {block: {height_eq: $height}}}, limit: 1) {
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
              hash: this.extHash.split('-')[0],
              height: parseInt(this.extHash.split('-')[1]),
            },
          })
        }

        if (!response || response.data.data.extrinsics.length === 0) {
          response = await axiosInstance.post('', {
            query: `
          query extrinsics($hash: String!) {
            extrinsics(where: { hash_eq: $hash }, limit: 1) {
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
              hash: this.extHash,
            },
          })
        }

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
