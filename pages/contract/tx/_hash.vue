<template>
  <div>
    <section>
      <b-container class="contract-call main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <NotFound
          v-else-if="!extrinsic"
          text="Contract transaction not found"
        />
        <Card v-else class="list-view">
          <Headline>Contract Transaction</Headline>
          <contract-transaction :contract="contract" :extrinsic="extrinsic" />
          <extrinsic-events :extrinsic-id="parseInt(extrinsic.id)" />
        </Card>
      </b-container>
    </section>
  </div>
</template>
<script>
import { gql } from 'graphql-tag'
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'
import ContractTransaction from '@/components/ContractTransaction.vue'

export default {
  components: {
    Loading,
    ContractTransaction,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      extrinsicHash: this.$route.params.hash,
      extrinsic: undefined,
      contractAddress: undefined,
      contract: undefined,
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
      this.extrinsicHash = this.$route.params.hash
    },
  },
  apollo: {
    extrinsics: {
      query: gql`
        query extrinsics($hash: String!) {
          extrinsics(where: { hash_eq: $hash }) {
            id
            block {
              height
            }
            index
            type
            signer
            section
            method
            args
            hash
            docs
            timestamp
            errorMessage
          }
        }
      `,
      skip() {
        return !this.extrinsicHash
      },
      variables() {
        return {
          hash: this.extrinsicHash,
        }
      },
      result({ data }) {
        this.extrinsic = data.extrinsics[0]
        this.extrinsic.block_id = this.extrinsic.block.height
        this.extrinsic.error_message = this.extrinsic.errorMessage
        const extrinsicArgs = this.extrinsic.args[0]
        // if transfer is native Reef there is no contractAddress
        this.contractAddress = extrinsicArgs.toLowerCase
          ? extrinsicArgs.toLowerCase()
          : null

        this.loading = false
      },
    },
    contracts: {
      // query: gql`
      //   query contracts($contractAddress: String!) {
      //     contracts(where: { id_eq: $contractAddress }) {
      //       id
      //       verified_contract {
      //         type
      //         name
      //         contract_data
      //       }
      //     }
      //   }
      // `,
      query: gql`
        query contracts($contractAddress: String!) {
          contracts(where: { id_eq: $contractAddress }) {
            id
          }
        }
      `,
      skip() {
        // return !this.contractAddress
        return true
      },
      variables() {
        return {
          contractAddress: this.contractAddress,
        }
      },
      result({ data }) {
        this.contract = data.contracts[0]
        this.contract.address = this.contractAddress.id
        if (this.contract) {
          this.contract.abi =
            data.contract[0] &&
            data.contract[0].verified_contract &&
            data.contract[0].verified_contract.compiled_data &&
            data.contract[0].verified_contract.compiled_data.flat
              ? data.contract[0].verified_contract.compiled_data.flat()
              : []
        }
        this.loading = false
      },
    },
  },
}
</script>
