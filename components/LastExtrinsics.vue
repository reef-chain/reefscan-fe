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
        <Cell :link="`/extrinsic/${item.block_id}/${item.index}`"
          ># {{ formatNumber(item.block_id) }}-{{ item.index }}</Cell
        >

        <Cell>{{ shortHash(item.hash) }}</Cell>
        <Cell>{{ item.section }} ➡ {{ item.method }}</Cell>
      </Row>
    </Table>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import Loading from '@/components/Loading.vue'

export default {
  components: {
    Loading,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      extrinsics: [],
    }
  },
  apollo: {
    $subscribe: {
      extrinsics: {
        query: gql`
          {
            extrinsicsConnection(orderBy: timestamp_DESC, first: 10) {
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
        // query: gql`
        //   subscription extrinsics {
        //     extrinsics(orderBy: block_height_DESC, where: {}, limit: 10) {
        //       id
        //       block {
        //         height
        //       }
        //       index
        //       type
        //       signer
        //       section
        //       method
        //       hash
        //       docs
        //     }
        //   }
        // `,
        result({ data }) {
          this.extrinsics = data.extrinsicsConnection.edges.map((item) => {
            return {
              ...item.node,
              block_id: item.node.block.height,
            }
          })
          this.loading = false
        },
      },
    },
  },
}
</script>
