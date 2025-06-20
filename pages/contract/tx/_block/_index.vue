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
      extrinsicIndex: Number(this.$route.params.index),
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
      this.extrinsicIndex = Number(this.$route.params.index)
      this.updateData()
    },
  },
  created() {
    this.updateData()
  },
  methods: {
    async updateData() {
      const EXTRINSICS_QUERY = `
        query extrinsics($block_height: Int!, $index: Int!) {
          extrinsics(
            where: { block: { height_eq: $block_height }, index_eq: $index }
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
      try {
        const response = await axiosInstance.post('', {
          query: EXTRINSICS_QUERY,
          variables: {
            block_height: this.blockNumber,
            index: this.extrinsicIndex,
          },
        })

        const data = response.data.data
        if (data && data.extrinsics) {
          this.parsedExtrinsic = data.extrinsics[0]
          this.parsedExtrinsic.block_id = this.parsedExtrinsic.block.height
          this.parsedExtrinsic.error_message = this.parsedExtrinsic.errorMessage
          this.parsedExtrinsic.signed_data = this.parsedExtrinsic.signedData
          this.loading = false
        }
      } catch (error) {}
    },
  },
}
</script>
