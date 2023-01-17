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
      blockHash: this.$route.params.hash,
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
      this.blockHash = this.$route.params.hash
    },
  },
  apollo: {
    extrinsics: {
      query: gql`
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
      skip() {
        return !this.blockHash
      },
      variables() {
        return {
          hash: this.blockHash,
        }
      },
      result({ data }) {
        this.parsedExtrinsic = data.extrinsics[0]
        this.parsedExtrinsic.block_id = this.parsedExtrinsic.block.height
        this.parsedExtrinsic.error_message = this.parsedExtrinsic.errorMessage
        this.parsedExtrinsic.signed_data = this.parsedExtrinsic.signedData
        this.loading = false
      },
    },
  },
}
</script>
