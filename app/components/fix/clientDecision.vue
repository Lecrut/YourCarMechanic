<script setup lang="ts">
import type { IFix } from '~/models/fix'
import { formatRange } from '~/models/priceList'
import { mapINotification } from '~/models/notification'
import { formatDateToString } from '~/utils/time'

/** What the workshop asks the client to approve: a visit booked for them, or a change of scope. */
const props = defineProps<{ fix: IFix }>()

const { t } = useI18n()
const fixesStore = useFixesStore()
const servicesStore = useServicesStore()
const { loading } = storeToRefs(useSharedStore())

const labels = (keys: string[]) => keys.map(servicesStore.label).join(', ')

const rejectBooking = () =>
  fixesStore.addNotification(props.fix, mapINotification({ notificationType: 'userCancel' }))
</script>

<template>
  <v-alert
    v-if="!fix.confirmed"
    type="info"
    variant="tonal"
    icon="mdi-account-hard-hat"
    :title="t('proposal.bookedByWorkshop')"
    :text="t('proposal.bookedByWorkshopText', { date: formatDateToString(fix.date) })"
    data-testid="booking-decision"
  >
    <div class="d-flex justify-end ga-2 mt-2">
      <v-btn
        variant="text"
        color="error"
        :loading="loading"
        data-testid="reject-booking"
        @click="rejectBooking"
      >
        {{ t('proposal.reject') }}
      </v-btn>
      <v-btn
        color="success"
        :loading="loading"
        data-testid="confirm-booking"
        @click="fixesStore.confirmBooking(fix)"
      >
        {{ t('proposal.confirm') }}
      </v-btn>
    </div>
  </v-alert>

  <v-alert
    v-else-if="fix.proposal"
    type="warning"
    variant="tonal"
    icon="mdi-swap-horizontal"
    :title="t('proposal.changeTitle')"
    data-testid="proposal-decision"
  >
    <v-table
      density="compact"
      class="bg-transparent my-2"
    >
      <thead>
        <tr>
          <th />
          <th>{{ t('proposal.current') }}</th>
          <th>{{ t('proposal.proposed') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{{ t('companyProfile.services') }}</td>
          <td>{{ labels(fix.services) }}</td>
          <td class="font-weight-bold">
            {{ labels(fix.proposal.services) }}
          </td>
        </tr>
        <tr>
          <td>{{ t('moderator.date') }}</td>
          <td>{{ formatDateToString(fix.date) }}</td>
          <td class="font-weight-bold">
            {{ formatDateToString(fix.proposal.date) }}
          </td>
        </tr>
        <tr>
          <td>{{ t('pricing.estimate') }}</td>
          <td>{{ fix.estimate ? formatRange(fix.estimate) : '—' }}</td>
          <td class="font-weight-bold">
            {{ fix.proposal.estimate ? formatRange(fix.proposal.estimate) : '—' }}
          </td>
        </tr>
        <tr>
          <td>{{ t('universal.description') }}</td>
          <td>{{ fix.description }}</td>
          <td class="font-weight-bold">
            {{ fix.proposal.description }}
          </td>
        </tr>
      </tbody>
    </v-table>
    <div class="d-flex justify-end ga-2">
      <v-btn
        variant="text"
        color="error"
        :loading="loading"
        data-testid="reject-proposal"
        @click="fixesStore.rejectProposal(fix)"
      >
        {{ t('proposal.reject') }}
      </v-btn>
      <v-btn
        color="success"
        :loading="loading"
        data-testid="accept-proposal"
        @click="fixesStore.acceptProposal(fix)"
      >
        {{ t('proposal.accept') }}
      </v-btn>
    </div>
  </v-alert>
</template>
