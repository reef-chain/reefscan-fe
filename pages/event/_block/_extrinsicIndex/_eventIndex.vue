<template>
  <div>
    <section>
      <b-container class="event-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <NotFound v-else-if="!parsedEvent" text="Event not found" />
        <Event v-else :event="parsedEvent" />
      </b-container>
    </section>
  </div>
</template>
<script>
import { gql } from 'graphql-tag'
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'
import Event from '@/components/Event.vue'

export default {
  components: {
    Loading,
    Event,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      blockId: this.$route.params.block,
      extrinsicIndex: this.$route.params.extrinsicIndex,
      eventIndex: this.$route.params.eventIndex,
      parsedEvent: undefined,
    }
  },
  head() {
    return {
      title: 'Reef block explorer',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Reef chain block explorer',
        },
      ],
    }
  },
  watch: {
    $route() {
      this.blockId = this.$route.params.block
      this.extrinsicIndex = this.$route.params.extrinsicIndex
      this.eventIndex = this.$route.params.eventIndex
    },
  },
  apollo: {
    events: {
      query: gql`
        query events(
          $block_id: Int!
          $extrinsic_index: Int!
          $event_index: Int!
        ) {
          events(
            where: {
              block: { height_eq: $block_id }
              index_eq: $event_index
              extrinsic: { index_eq: $extrinsic_index }
            }
            limit: 1
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
      skip() {
        return !this.blockId || !this.extrinsicIndex || !this.eventIndex
      },
      variables() {
        return {
          block_id: parseInt(this.blockId),
          extrinsic_index: parseInt(this.extrinsicIndex),
          event_index: parseInt(this.eventIndex),
        }
      },
      result({ data }) {
        this.parsedEvent = data?.events[0]
        this.parsedEvent.block_id = this.parsedEvent.block.height
        this.parsedEvent.extrinsic.block_id =
          this.parsedEvent.extrinsic.block.height
        this.loading = false
      },
    },
  },
}
</script>
