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

<!-- computed: {
  blockNumber() {
    return this.$route.params.block || ''
  },
  extrinsicHash() {
    return this.$route.query.extrinsicHash || ''
  },
}, -->

<script>
import { gql } from 'graphql-tag'
import Loading from '@/components/Loading.vue'
import Extrinsic from '@/components/Extrinsic.vue'
import commonMixin from '@/mixins/commonMixin.js'

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
      extrinsicHash: this.$route.params.extrinsicHash,
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
      this.extrinsicHash = this.$route.query.extrinsicHash
    },
  },
  apollo: {
    extrinsics: {
      query: gql`
        query extrinsics($block_height: Int!, $extrinsicHash: String!) {
          extrinsics(
            where: {
              block: { height_eq: $block_height }
              hash_eq: $extrinsicHash
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
      skip() {
        return !this.blockNumber
      },
      variables() {
        return {
          block_height: this.blockNumber,
          extrinsicHash: this.extrinsicHash,
        }
      },
      fetchPolicy: 'network-only',
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
