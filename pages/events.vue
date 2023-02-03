<template>
  <div class="list-view">
    <Search
      v-model="filter"
      :placeholder="$t('pages.events.search_placeholder')"
      :label="`${$t('pages.events.title')} ${
        formatNumber(totalRows) <= 1 ? '' : formatNumber(totalRows)
      }`"
    />

    <section>
      <b-container>
        <div class="list-view__table">
          <div v-if="loading" class="text-center py-4">
            <Loading />
          </div>
          <Table v-else>
            <THead>
              <Cell>Event</Cell>
              <Cell>Block</Cell>
              <Cell>Age</Cell>
              <Cell>Section/Method</Cell>
              <Cell>Data</Cell>
            </THead>

            <Row v-for="(item, index) in events" :key="index">
              <Cell
                :link="`/event/${item.extrinsic.block_id}/${item.extrinsic.index}/${item.index}`"
                ># {{ formatNumber(item.extrinsic.block_id) }}-{{
                  formatNumber(item.extrinsic.index)
                }}-{{ item.index }}</Cell
              >

              <Cell :link="`/block?blockNumber=${item.block_id}`"
                ># {{ formatNumber(item.block_id) }}</Cell
              >

              <Cell class="list-view__age">
                <font-awesome-icon :icon="['far', 'clock']" />
                <span>{{ getAge(item.timestamp) }}</span>
                <span>({{ formatTimestamp(item.timestamp) }})</span>
              </Cell>

              <Cell>{{ item.section }} ➡ {{ item.method }}</Cell>

              <Cell>{{ item.data }}</Cell>
            </Row>
          </Table>

          <div class="list-view__pagination">
            <PerPage v-model="perPage" />
            <b-pagination
              v-model="currentPage"
              :total-rows="totalRows"
              :per-page="perPage"
            />
          </div>
        </div>
      </b-container>
    </section>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import Search from '@/components/Search'
import Loading from '@/components/Loading.vue'
import { paginationOptions } from '@/frontend.config.js'

export default {
  components: {
    Loading,
    Search,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      filter: '',
      events: [],
      paginationOptions,
      perPage: null,
      currentPage: 1,
      totalRows: 1,
      nEvents: 0,
    }
  },
  apollo: {
    $subscribe: {
      events: {
        // query: gql`
        //   subscription events(
        //     $blockNumber: bigint_comparison_exp
        //     $perPage: Int!
        //     $offset: Int!
        //   ) {
        //     event(
        //       limit: $perPage
        //       offset: $offset
        //       where: { block_id: $blockNumber }
        //       order_by: { id: desc, index: desc }
        //     ) {
        //       id
        //       block_id
        //       extrinsic {
        //         id
        //         block_id
        //         index
        //       }
        //       index
        //       data
        //       method
        //       phase
        //       section
        //       timestamp
        //     }
        //   }
        // `,
        query: gql`
          subscription events(
            $blockNumber: BlockWhereInput!
            $perPage: Int!
            $offset: Int!
          ) {
            events(
              limit: $perPage
              offset: $offset
              where: { block: $blockNumber }
              orderBy: id_DESC
            ) {
              id
              block {
                height
              }
              extrinsic {
                id
                block {
                  height
                }
                index
              }
              index
              data
              method
              phase
              section
              timestamp
            }
          }
        `,
        variables() {
          return {
            blockNumber: this.filter
              ? { height_eq: parseInt(this.filter) }
              : {},
            perPage: this.perPage,
            offset: (this.currentPage - 1) * this.perPage,
          }
        },
        result({ data }) {
          this.events = data.events
          this.events.forEach((event) => {
            event.block_id = event.block.height
            event.extrinsic.block_id = event.extrinsic.block.height
          })
          this.totalRows = this.filter ? this.events.length : this.nEvents
          this.loading = false
        },
      },
      totalEvents: {
        query: gql`
          subscription chain_info {
            chainInfos(where: { id_eq: "events" }, limit: 1) {
              count
            }
          }
        `,
        result({ data }) {
          this.nEvents = data.chainInfos[0].count
          this.totalRows = this.nEvents
        },
      },
    },
  },
}
</script>
