<template>
  <div v-if="request" class="py-2">
    <b-alert v-if="request.status === 'PENDING'" variant="info" show>
      <p class="text-center pt-3">
        Verification status for contract
        {{ request.contract_id }} is {{ request.status }}, please wait until
        contract is verified
      </p>
    </b-alert>
    <b-alert v-if="request.status === 'VERIFIED'" variant="success" show>
      <p class="text-center pt-3">
        Your contract
        {{ request.contract_id }} is {{ request.status }}
      </p>
    </b-alert>
    <b-alert v-if="request.status === 'ERROR'" variant="danger" show>
      <p class="text-center pt-3">
        Your contract
        {{ request.contract_id }} verification was not successful!
      </p>
      <p
        v-if="request.error_type === 'BYTECODE_MISMATCH'"
        class="text-center pt-3"
      >
        <strong>{{ request.error_type }}</strong
        >: The request contract bytecode didn't match on-chain one
      </p>
      <p
        v-if="request.error_type === 'COMPILATION_ERROR'"
        class="text-center pt-3"
      >
        <strong>{{ request.error_type }}</strong
        >: We are not able to compile the provided source code
      </p>
    </b-alert>
  </div>
</template>

<script>
import { network as nw } from '@reef-chain/util-lib'
import axiosInstance from '~/utils/axios'
import ObsPolling from '~/utils/obsPolling'

export default {
  props: {
    id: {
      type: String,
      default: () => '',
    },
  },
  data() {
    return {
      request: null,
      callbackId: null,
      previousPage: null,
    }
  },
  created() {
    this.updateData()
    ObsPolling.addCallback(
      nw.getLatestBlockContractEvents$([this.id]),
      this.updateData
    )
  },
  destroyed() {
    ObsPolling.removeCallback(this.updateData)
  },
  methods: {
    async updateData() {
      try {
        const response = await axiosInstance.post('', {
          query: `
            query contract_verification_request($id: String!) {
              contract_verification_request(where: { id: { _eq: $id } }) {
                contract_id
                status
                error_type
              }
            }
          `,
          variables: {
            id: this.id ? this.id : '',
          },
        })
        const data = response.data.data
        if (data.contract_verification_request[0]) {
          this.request = data.contract_verification_request[0]
        }
      } catch (error) {}
    },
  },
}
</script>
