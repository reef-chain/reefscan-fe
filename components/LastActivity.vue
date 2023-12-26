<template>
  <div class="last-activity">
    <div class="table-responsive">
      <b-table striped hover :fields="fields" :items="extrinsics">
        <template #cell(block_id)="data">
          <p class="mb-0">
            <nuxt-link :to="`/block?blockNumber=${data.item.block_id}`">
              #{{ formatNumber(data.item.block_id) }}
            </nuxt-link>
          </p>
        </template>
        <template #cell(signer)="data">
          <p class="mb-0 d-inline-block">
            <ReefIdenticon
              :key="data.item.signer"
              :address="data.item.signer"
              :size="20"
            />
            <nuxt-link :to="`/account/${data.item.signer}`">
              {{ shortAddress(data.item.signer) }}
            </nuxt-link>
          </p>
        </template>
        <template #cell(section)="data">
          <p class="mb-0">
            {{ data.item.section }} ➡
            {{ data.item.method }}
          </p>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'
import BlockTimeout from '@/utils/polling.js'
import axiosInstance from '~/utils/axios'

export default {
  mixins: [commonMixin],
  data() {
    return {
      extrinsics: [],
      fields: [
        {
          key: 'block_id',
          label: 'Id',
          sortable: true,
        },
        {
          key: 'signer',
          label: 'Signer',
          class: 'd-none d-sm-none d-md-none d-lg-block d-xl-block',
          sortable: true,
        },
        {
          key: 'section',
          label: 'Extrinsic',
          sortable: true,
        },
      ],
      callbackId: null,
    }
  },
  created() {
    this.updateData()
    BlockTimeout.addCallback(this.updateData)
  },
  destroyed() {
    BlockTimeout.removeCallback(this.updateData)
  },
  methods: {
    async updateData() {
      try {
        const response = await axiosInstance.post('', {
          query: `
            query extrinsics {
              extrinsic: extrinsicsConnection(
                orderBy: { block_id: desc }
                where: { type: { _eq: "signed" } }
                first: 10
              ) {
                edges {
                  node {
                    id
                    block_id
                    index
                    type
                    signer
                    section
                    method
                    hash
                    docs
                  }
                }
              }
            }
          `,
        })
        const data = response.data.data
        const dataArr = []
        if (data.extrinsic.edges) {
          for (let idx = 0; idx < data.extrinsic.edges.length; idx++) {
            dataArr.push(data.extrinsic.edges[idx].node)
          }
          data.extrinsic = dataArr
          this.extrinsic = dataArr
        }
        this.extrinsics = data.extrinsic
      } catch (error) {
        this.setPerPage(20)
        this.$bvToast.toast(`Exceeds the size limit`, {
          title: 'Encountered an Error',
          variant: 'danger',
          autoHideDelay: 5000,
          appendToast: false,
        })
      }
    },
    setPerPage(value) {
      this.perPage = value
    },
  },
}
</script>

<style>
.last-activity .table th,
.last-activity .table td {
  padding: 0.45rem;
}
.last-activity .table thead th {
  border-bottom: 0;
}
.last-activity .identicon {
  display: inline-block;
  margin: 0 0.2rem 0 0;
  cursor: copy;
}
</style>
