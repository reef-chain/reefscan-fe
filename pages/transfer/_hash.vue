<template>
  <div>
    <section>
      <b-container class="transfer-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <NotFound
          v-else-if="!transfers || (transfers && transfers.length == 0)"
          text="Transfer not found"
        />
        <section v-else>
          <b-container>
            <div class="list-view__table">
              <Table class="accounts__table">
                <THead>
                  <Cell align="center">Transfer</Cell>
                  <Cell>Extrinsic</Cell>
                  <Cell>From</Cell>
                  <Cell>To</Cell>
                  <Cell>Age</Cell>
                  <Cell>Success</Cell>
                </THead>

                <Row v-for="(item, index) in transfers" :key="index">
                  <Cell
                    align="center"
                    :link="`/transfer/${item.blockHeight}/${item.extrinsicIndex}/${item.eventIndex}`"
                    >{{ shortHash(item.extrinsicHash) }}</Cell
                  >
                  <Cell
                    :link="`/extrinsic/${item.blockHeight}/${item.extrinsicIndex}`"
                  >
                    #{{ formatNumber(item.blockHeight) }}-{{
                      formatNumber(item.extrinsicIndex)
                    }}
                  </Cell>
                  <Cell
                    v-if="item.from.id"
                    :link="{ url: `/account/${item.from.id}`, fill: false }"
                  >
                    <eth-identicon :address="item.from.id" :size="20" />
                    <span>{{ shortHash(item.from.id) }}</span>
                  </Cell>
                  <Cell
                    v-if="item.to.id"
                    :link="{ url: `/account/${item.to.id}`, fill: false }"
                  >
                    <eth-identicon :address="item.to.id" :size="20" />
                    <span>{{ shortHash(item.to.id) }}</span>
                  </Cell>
                  <Cell class="list-view__age">
                    <font-awesome-icon :icon="['far', 'clock']" />
                    <span class="ml-2">{{ getAge(item.timestamp) }}</span>
                  </Cell>
                  <Cell align="left">
                    <font-awesome-icon
                      v-if="item.success"
                      icon="check"
                      class="text-success"
                    />
                    <font-awesome-icon
                      v-else
                      icon="times"
                      class="text-danger"
                    />
                  </Cell>
                </Row>
              </Table>
            </div>
          </b-container>
        </section>
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
      hash: this.$route.params.hash,
      transfers: undefined,
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
  created() {
    this.updateData()
  },
  methods: {
    async updateData() {
      try {
        const response = await axiosInstance.post('', {
          query: `
            query TransfersQuery($blockHash:String!) {
              transfers(limit: 10, orderBy: timestamp_DESC, where: {extrinsicHash_containsInsensitive: $blockHash}) {
                id
                extrinsicHash
                eventIndex
                extrinsicId
                extrinsicIndex
                success
                timestamp
                from {
                  id
                }
                to {
                  id
                }
                blockHeight
              }
            }
          `,
          variables: {
            blockHash: this.hash,
          },
        })

        const data = response.data.data
        if (data && data.transfers) {
          this.transfers = data.transfers
          if (data.transfers.length === 1) {
            this.$router.push({
              path: `/transfer/${data.transfers[0].blockHeight}/${data.transfers[0].extrinsicIndex}/${data.transfers[0].eventIndex}`,
            })
          }
        }
        this.loading = false
      } catch (error) {}
    },
  },
}
</script>

<style>
.ml-2 {
  margin-left: 0.5rem;
}
</style>
