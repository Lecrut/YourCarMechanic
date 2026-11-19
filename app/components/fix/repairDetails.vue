<script setup lang="ts">
import { type IFix, isFixFinished, latestQuote, type ViewerMode } from '~/models/fix'
import type { IWorkshop } from '~/models/workshop'
import { type INotification, mapINotification, type NotificationType } from '~/models/notification'
import { formatRange, isWithin } from '~/models/priceList'
import { notificationLabel, statusOptions } from '~/composables/notifications'
import { formatDateToString, toLocalInput } from '~/utils/time'
import formValidation from '~/utils/formValidation'
import { requiredRule } from '~/utils/rules'
import CarCard from '~/components/user/carCard.vue'
import ClientDecision from '~/components/fix/clientDecision.vue'
import ProposeChangeDialog from '~/components/fix/proposeChangeDialog.vue'
import WorkshopCard from '~/components/user/workshopCard.vue'

const isDialogShown = defineModel<boolean>({ default: false })

const props = defineProps<{
  fix: IFix
  mode: ViewerMode
}>()

const { t } = useI18n()

const workshopsStore = useWorkshopStore()
const fixesStore = useFixesStore()
const moderatorStore = useModeratorStore()
const servicesStore = useServicesStore()
const { error, loading } = storeToRefs(useSharedStore())

const { form, valid, isValid } = formValidation()

const workshop = ref<IWorkshop | null>(null)
const showPropose = ref(false)
const isAddStatus = ref(false)
const newStatus = ref<NotificationType | null>(null)
const newStatusDate = ref('')
const useCurrentDate = ref(true)
const newStatusCost = ref<number | null>(null)
const newStatusDescription = ref('')

const options = computed(() => statusOptions(t, props.mode, props.fix.notifications.length > 0, props.fix.confirmed))
const canAddStatus = computed(() => options.value.length > 0 && !props.fix.isClosed && !isFixFinished(props.fix))
const quote = computed(() => latestQuote(props.fix))
const canPropose = computed(() => props.mode === 'workshop' && !props.fix.isClosed && !props.fix.proposal)
const needsCost = computed(() => newStatus.value === 'addExpense' || newStatus.value === 'addQuote')

/** The mechanic's quote must fit the estimate given at booking; moderators may override. */
const costRules = computed(() => {
  const rules: ((v: number | null) => true | string)[] = [v => (v != null && v > 0) || t('rules.requiredRule')]
  const range = props.fix.estimate
  if (newStatus.value === 'addQuote' && range && props.mode === 'workshop')
    rules.push(v => isWithin(Number(v), range) || t('pricing.quoteOutOfRange', { range: formatRange(range) }))
  return rules
})

function statusComment(item: INotification): string {
  switch (item.notificationType) {
    case 'getCar': return t('notifications.comments.getCar')
    case 'addExpense': return `${t('notifications.comments.addExpense')}${item.cost} PLN`
    case 'addQuote': return `${t('notifications.comments.addQuote')}${item.cost} PLN`
    case 'addGiveBackTime': return t('notifications.comments.addGiveBackTime') + formatDateToString(item.date)
    case 'giveBackCar': return t('notifications.comments.giveBackCar')
    case 'moderatorCancel': return t('notifications.comments.moderatorCancel')
    default: return ''
  }
}

function resetAddStatus() {
  isAddStatus.value = false
  newStatus.value = null
  newStatusDate.value = toLocalInput(new Date())
  useCurrentDate.value = true
  newStatusCost.value = null
  newStatusDescription.value = ''
}

async function addNotification() {
  if (!newStatus.value || !(await isValid())) return

  const notification = mapINotification({
    notificationType: newStatus.value,
    cost: needsCost.value ? newStatusCost.value : null,
    description: newStatusDescription.value,
    date: useCurrentDate.value ? new Date() : new Date(newStatusDate.value),
  })

  if (props.mode === 'moderator') await moderatorStore.addNotification(props.fix, notification)
  else await fixesStore.addNotification(props.fix, notification)

  if (!error.value) resetAddStatus()
}

function close() {
  isDialogShown.value = false
  resetAddStatus()
}

watch(isDialogShown, async (shown) => {
  if (shown && props.fix.companyRef && props.mode !== 'workshop')
    workshop.value = await workshopsStore.getWorkshopByRef(props.fix.companyRef)
})
</script>

<template>
  <v-dialog
    max-width="1100px"
    :model-value="isDialogShown"
    scrollable
    @update:model-value="close"
  >
    <v-card>
      <v-card-item>
        <v-card-title class="d-flex align-center">
          <v-icon
            icon="mdi-calendar-blank"
            color="primary"
            class="mr-2"
          />
          {{ formatDateToString(fix.date) }}
          <v-chip
            v-if="fix.createdBy === 'workshop'"
            class="ml-3"
            color="info"
            size="small"
            prepend-icon="mdi-account-hard-hat"
          >
            {{ t('proposal.createdByWorkshop') }}
          </v-chip>
          <v-chip
            v-if="mode === 'moderator'"
            class="ml-3"
            color="warning"
            size="small"
            prepend-icon="mdi-shield-account"
          >
            {{ t('moderator.moderation') }}
          </v-chip>
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            color="default"
            @click="close"
          />
        </v-card-title>
      </v-card-item>

      <v-divider />

      <v-card-text>
        <client-decision
          v-if="mode === 'user'"
          :fix="fix"
          class="mb-4"
        />
        <v-alert
          v-else-if="fix.proposal || !fix.confirmed"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-4"
          :text="t('proposal.waitingForClient')"
        />

        <v-row>
          <v-col
            cols="12"
            md="5"
          >
            <car-card
              :only-show="true"
              :car="fix.car"
            />

            <workshop-card
              v-if="workshop"
              :workshop="workshop"
              :is-presentation="true"
            />
          </v-col>

          <v-col
            cols="12"
            md="7"
          >
            <v-chip-group column>
              <v-chip
                v-for="item in fix.services"
                :key="item"
                color="primary"
                variant="tonal"
                density="comfortable"
              >
                {{ servicesStore.label(item) }}
              </v-chip>
            </v-chip-group>

            <v-textarea
              :model-value="fix.description"
              :label="t('universal.description')"
              variant="solo-filled"
              readonly
              auto-grow
              rows="2"
            />

            <v-list
              density="compact"
              bg-color="transparent"
            >
              <v-list-item
                prepend-icon="mdi-car-info"
                :title="`${fix.carMillage} km`"
              />
              <v-list-item
                v-if="fix.estimate"
                prepend-icon="mdi-cash-multiple"
                :title="formatRange(fix.estimate)"
                :subtitle="t('pricing.estimate')"
              />
              <v-list-item
                v-if="quote"
                prepend-icon="mdi-file-document-check-outline"
                :title="`${quote.cost} PLN`"
                :subtitle="t('fixStatues.addQuote')"
                data-testid="quote"
              />
              <v-list-item
                v-if="fix.clientPhone && mode !== 'user'"
                prepend-icon="mdi-phone"
                :title="fix.clientPhone"
                :href="`tel:${fix.clientPhone}`"
              />
            </v-list>
          </v-col>
        </v-row>

        <template v-if="fix.notifications.length">
          <v-divider class="my-4" />
          <div class="text-headline-small text-center mb-4">
            {{ t('fixStatues.title') }}
          </div>

          <v-timeline
            align="start"
            side="end"
            density="compact"
          >
            <v-timeline-item
              v-for="(item, index) in fix.notifications"
              :key="index"
              :dot-color="item.notificationType === 'moderatorCancel' ? 'warning' : 'primary'"
              size="small"
            >
              <v-card
                variant="tonal"
                hover
              >
                <v-card-item
                  :title="notificationLabel(t, item.notificationType)"
                  :subtitle="formatDateToString(item.sendDate)"
                />
                <v-card-text v-if="statusComment(item) || item.description">
                  <p>{{ statusComment(item) }}</p>
                  <p v-if="item.description">
                    {{ item.description }}
                  </p>
                </v-card-text>
              </v-card>
            </v-timeline-item>
          </v-timeline>
        </template>

        <div
          v-if="(canAddStatus || canPropose) && !isAddStatus"
          class="mt-5 d-flex justify-center flex-wrap ga-2"
        >
          <v-btn
            v-if="canPropose"
            prepend-icon="mdi-swap-horizontal"
            variant="tonal"
            data-testid="propose-change"
            @click="showPropose = true"
          >
            {{ t('proposal.proposeTitle') }}
          </v-btn>
          <v-btn
            v-if="canAddStatus"
            prepend-icon="mdi-plus"
            :color="mode === 'moderator' ? 'warning' : 'primary'"
            data-testid="add-status"
            @click="isAddStatus = true"
          >
            {{ t('notifications.addStatus') }}
          </v-btn>
        </div>

        <v-expand-transition>
          <v-sheet
            v-if="isAddStatus"
            class="mt-4 pa-4"
            border
          >
            <v-form
              ref="form"
              v-model="valid"
              :disabled="loading"
              @submit.prevent="addNotification"
            >
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                >
                  <v-select
                    v-model="newStatus"
                    :label="t('fixStatues.title')"
                    :items="options"
                    :rules="[requiredRule(t)]"
                    data-testid="status-type"
                  />
                </v-col>

                <v-col
                  v-if="needsCost"
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model.number="newStatusCost"
                    min="1"
                    type="number"
                    :label="newStatus === 'addQuote' ? t('pricing.quote') : t('notifications.expense')"
                    :hint="newStatus === 'addQuote' && fix.estimate ? t('pricing.allowedRange', { range: formatRange(fix.estimate) }) : ''"
                    persistent-hint
                    :rules="costRules"
                    suffix="PLN"
                    data-testid="status-cost"
                  />
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                >
                  <v-switch
                    v-model="useCurrentDate"
                    color="primary"
                    :label="t('notifications.setCurrantDate')"
                  />
                </v-col>

                <v-col
                  v-if="!useCurrentDate"
                  cols="12"
                  md="6"
                >
                  <v-text-field
                    v-model="newStatusDate"
                    type="datetime-local"
                    :min="toLocalInput(fix.bookDate)"
                    :label="t('notifications.date')"
                    :rules="[requiredRule(t)]"
                  />
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="newStatusDescription"
                    :label="t('notifications.description')"
                    rows="2"
                    auto-grow
                    :rules="newStatus === 'moderatorCancel' ? [requiredRule(t)] : []"
                  />
                </v-col>
              </v-row>

              <div class="d-flex justify-end ga-2">
                <v-btn
                  color="default"
                  variant="text"
                  @click="resetAddStatus"
                >
                  {{ t('universal.cancel') }}
                </v-btn>
                <v-btn
                  :loading="loading"
                  data-testid="save-status"
                  @click="addNotification"
                >
                  {{ t('universal.add') }}
                </v-btn>
              </div>
            </v-form>
          </v-sheet>
        </v-expand-transition>
      </v-card-text>
    </v-card>
  </v-dialog>

  <propose-change-dialog
    v-if="mode === 'workshop'"
    v-model="showPropose"
    :fix="fix"
  />
</template>
