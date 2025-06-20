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
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'
import Event from '@/components/Event.vue'
import axiosInstance from '~/utils/axios'

export default {
  components: {
    Loading,
    Event,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      extrinsicId: this.$route.params.block,
      eventIndex: this.$route.params.index,
      parsedEvent: undefined,
    }
  },
  head() {
    return {
      title: 'Reef chain block explorer',
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
      this.extrinsicId = this.$route.params.block
      this.eventIndex = this.$route.params.index
      this.updateData()
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
            query event($extrinsic_id: Int!, $index: Int!) {
              events(
                where: { extrinsic: { id_eq: $extrinsic_id }, index_eq: $index }
              ) {
                id
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
          variables: {
            extrinsic_id: parseInt(this.extrinsicId),
            index: parseInt(this.eventIndex),
          },
        })

        const data = response.data.data
        if (data && data.events && data.events[0]) {
          this.parsedEvent = data.events[0]
          this.parsedEvent.extrinsic.block_id =
            this.parsedEvent.extrinsic.block.id
        }

        this.loading = false
      } catch (error) {}
    },
  },
}
</script>
