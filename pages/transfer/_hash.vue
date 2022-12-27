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
  apollo: {
    transfers: {
      query: gql`
        query transfers($hash: String!) {
          transfers(where: { extrinsic: { hash_eq: $hash } }) {
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
              events(where: { method_eq: "Transfer" }) {
                data
                extrinsic {
                  id
                }
              }
            }
            token {
              id
            }
            feeAmount
          }
        }
      `,
      skip() {
        return !this.hash
      },
      variables() {
        return {
          hash: this.hash,
        }
      },
      result({ data }) {
        if (data && data.transfers) {
          this.transfer = data.transfers[0]
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
          this.token_address = this.transfer.token.id
          if (
            this.transfer.token &&
            this.transfer.token.verified_contract &&
            this.transfer.token.verified_contract.contract_data
          ) {
            this.transfer.tokenName =
              this.transfer.token.verified_contract.contract_data.name
            this.transfer.symbol =
              this.transfer.token.verified_contract.contract_data.symbol
            this.transfer.decimals =
              this.transfer.token.verified_contract.contract_data.decimals
          }
        }
        this.loading = false
      },
    },
  },
}
</script>
