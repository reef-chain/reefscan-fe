<template>
  <div class="last-extrinsics">
    <div class="headline">
      <nuxt-link
        v-b-tooltip.hover
        :to="`/extrinsics`"
        title="Click to see last extrinsics"
      >
        Last Extrinsics
      </nuxt-link>
    </div>
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <Table v-else>
      <THead>
        <Cell>Id</Cell>
        <Cell>Hash</Cell>
        <Cell>Extrinsic</Cell>
      </THead>
      <Row v-for="(item, index) in extrinsics" :key="'item-' + index">
        <Cell :link="`/extrinsic/${item.block_id}/${item.index}`">
          # {{ formatNumber(item.block_id) }}-{{ item.index }}
        </Cell>
        <Cell>{{ shortHash(item.hash) }}</Cell>
        <Cell>{{ item.section }} ➡ {{ item.method }}</Cell>
      </Row>
    </Table>
  </div>
</template>

<script>
import { reefState } from '@reef-chain/util-lib'
import commonMixin from '@/mixins/commonMixin.js'
import Loading from '@/components/Loading.vue'
import axiosInstance from '~/utils/axios'

export default {
  components: {
    Loading,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      extrinsics: [],
      callbackId: null,
    }
  },
  created() {
    this.updateData()
    reefState.selectedProvider$.subscribe(async (provider) => {
      this.unsubscribe = await provider.api.rpc.chain.subscribeNewHeads(
        (header) => {
          this.lastBlockOnChain = header.number
          this.updateData()
        }
      )
    })
  },
  destroyed() {
    this.unsubscribe()
  },
  methods: {
    async updateData() {
      try {
        const response = await axiosInstance.post('', {
          query: `
            query extrinsics {
              extrinsics: extrinsicsConnection(
                orderBy: id_DESC
                first: 10
                after: "1"
              ) {
                edges {
                  node {
                    id
                    block {
                      height
                    }
                    index
                    type
                    signer
                    section
                    method
                    hash
                  }
                }
              }
            }
          `,
        })
        const data = response.data.data
        const dataArr = []
        if (data.extrinsics.edges) {
          for (let idx = 0; idx < data.extrinsics.edges.length; idx++) {
            dataArr.push(data.extrinsics.edges[idx].node)
          }
          data.extrinsics = dataArr
          this.extrinsics = dataArr
        }
        this.extrinsics = data.extrinsics.map((item) => {
          return {
            ...item,
            block_id: item.block.height,
          }
        })
        this.loading = false
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
