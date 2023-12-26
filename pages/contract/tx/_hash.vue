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
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'
import ContractTransaction from '@/components/ContractTransaction.vue'
import axiosInstance from '~/utils/axios'

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
      this.updateData()
    },
  },
  created() {
    this.updateData()
  },
  methods: {
    async updateData() {
      if (!this.extrinsicHash) return

      const EXTRINSICS_QUERY = `
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
      `

      const CONTRACTS_QUERY = `
        query contracts($contractAddress: String!) {
          contracts(where: { id_eq: $contractAddress }) {
            id
          }
        }
      `

      try {
        const extrinsicsResponse = await axiosInstance.post('', {
          query: EXTRINSICS_QUERY,
          variables: {
            hash: this.extrinsicHash,
          },
        })

        const extrinsicsData = extrinsicsResponse.data.data
        if (extrinsicsData && extrinsicsData.extrinsics) {
          this.extrinsic = extrinsicsData.extrinsics[0]
          this.extrinsic.block_id = this.extrinsic.block.height
          this.extrinsic.error_message = this.extrinsic.errorMessage

          const extrinsicArgs = this.extrinsic.args[0]
          // if transfer is native Reef there is no contractAddress
          this.contractAddress = extrinsicArgs.toLowerCase
            ? extrinsicArgs.toLowerCase()
            : null
        }

        if (this.contractAddress) {
          const contractsResponse = await axiosInstance.post('', {
            query: CONTRACTS_QUERY,
            variables: {
              contractAddress: this.contractAddress,
            },
          })

          const contractsData = contractsResponse.data.data
          this.contract = contractsData.contracts[0]
          if (this.contract) {
            this.contract.address = this.contractAddress.id
            this.contract.abi =
              contractsData.contract[0] &&
              contractsData.contract[0].verified_contract &&
              contractsData.contract[0].verified_contract.compiled_data &&
              contractsData.contract[0].verified_contract.compiled_data.flat
                ? contractsData.contract[0].verified_contract.compiled_data.flat()
                : []
          }
        }

        this.loading = false
      } catch (error) {}
    },
  },
}
</script>
