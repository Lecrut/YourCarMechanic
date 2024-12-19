<script setup lang="ts">
import type {IFix} from "~/models/fix";
import CarCard from "~/components/user/carCard.vue";
import type {Ref} from "vue";
import type {IWorkshop} from "~/models/workshop";
import WorkshopCard from "~/components/user/workshopCard.vue";
import {services} from "~/composable/services";
import {formatDateToString} from "~/helpers/time";
import {duringNotification, notifications, startNotification} from "~/composable/notifications";
import {mapINotification} from "~/models/notification";
import formValidation from "~/helpers/formValidation";
import {requiredArrayRule, requiredRule} from "~/helpers/rules";
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'
import {useTheme} from "vuetify";

const isDialogShown = defineModel<boolean>()

const props = defineProps<{
  fix: IFix
  isCompany: boolean
}>()

const {fix, isCompany} = toRefs(props)

const {t} = useI18n()
const theme = useTheme()

const workshopsStore = useWorkshopStore()
const fixesStore = useFixesStore()

const sharedStore = useSharedStore()
const {error, loading} = storeToRefs(sharedStore)

const {form, valid, isValid} = formValidation()

const workshop: Ref<IWorkshop | null> = ref(null)
const isAddStatus = ref(false)
const addNotificationStatus = ref(null)
const notificationDate = ref(new Date)
const notificationIsCurrentDate = ref(false)
const notificationCost = ref(0)
const notificationDescription = ref('')
const isNotificationDescription = ref(false)

const notificationsType = computed(() => {
  return fix.value.notifications.length ? duringNotification(t) : startNotification(t)
})

const isFixEnd = computed(() => {
  return fix.value.notifications.some(x => x.notificationType === 'giveBackCar')
})

const isDark = computed(() => theme.global.name.value === 'dark')

function resetAddStatus() {
  isAddStatus.value = false
  addNotificationStatus.value = null
  notificationDate.value = new Date()
  notificationIsCurrentDate.value = false
  notificationCost.value = 0
  notificationDescription.value = ''
  isNotificationDescription.value = false
}

async function addNotification() {
  if (await isValid()) {
    await fixesStore.addNotification(
        fix.value,
        mapINotification(
            {
              sendDate: new Date(),
              notificationType: addNotificationStatus.value || '',
              cost: addNotificationStatus.value === 'addExpense' ? notificationCost.value : null,
              description: notificationDescription.value,
              date: notificationIsCurrentDate.value ? new Date() : notificationDate.value
            }
        )
    )
    if (!error.value)
      resetAddStatus()
  }
}

function close() {
  isDialogShown.value = false
  resetAddStatus()
}

watch(isDialogShown, async (newValue) => {
  if (newValue && fix.value && fix.value.companyRef && !isCompany.value) {
    workshop.value = await workshopsStore.getWorkshopByRef(fix.value.companyRef)
  }
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
      <v-card-title>

      </v-card-title>

      <v-card-text>
        <v-row>
          <v-col
              cols="12"
              md="5"
              sm="12"
              align="center"
          >
            <car-card
                :only-show="true"
                :car="fix.car"
            />

            <workshop-card
                v-if="workshop && !isCompany"
                :workshop="workshop"
                :book-fix="close"
                :is-presentation="true"
            />
          </v-col>

          <v-col cols="12" md="7" sm="12">
            <div class="my-2 text-h5" align="center">
              <v-icon
                  icon="mdi-calendar-blank"
                  color="primary"
                  class="mx-2 mb-2"
              ></v-icon>
              {{ formatDateToString(fix.date) }}
            </div>

            <v-divider/>

            <v-chip-group column>
              <v-chip
                  v-for="(item) in fix.services"
                  density="comfortable"
                  class="mr-1 my-2"
              >
                {{ services(t).find(x => x.value === item)?.title || '' }}
              </v-chip>
            </v-chip-group>

            <v-divider class="my-2"/>

            <v-textarea
                :model-value="fix.description"
                :label="t('universal.description')"
                variant="solo"
                readonly
            />

            <v-divider class="my-2"/>

            <div class="my-2" align="center">
              <v-icon
                  icon="mdi-car-info"
                  color="primary"
                  class="mx-2 mb-2"
              ></v-icon>
              {{ fix.carMillage }}km
            </div>

            <div v-if="fix.clientPhone && isCompany" class="my-2" align="center">
              <v-icon
                  icon="mdi-phone"
                  color="primary"
                  class="mx-2 mb-2"
              ></v-icon>
              {{ fix.clientPhone }}
            </div>

          </v-col>
        </v-row>
        <v-divider/>

        <div
            v-if="fix.notifications.length"
            align="center"
            class="text-h5 my-4"
        >
          {{ t('fixStatues.title') }}
        </div>

        <v-timeline
            align="start"
            side="end"
        >
          <v-timeline-item
              v-for="(item) in fix.notifications"
              dot-color="primary"
              size="small"
          >
            <template v-slot:opposite>
               <span>
                {{ formatDateToString(item.date) }}
              </span>
            </template>

            <div>
              <div class="text-h6">
                {{ notifications(t).find(x => item.notificationType === x.value).title }}
              </div>
              <p>
                {{
                  item.notificationType === 'getCar'
                      ? t('notifications.comments.getCar')
                      : item.notificationType === 'addExpense'
                          ? t('notifications.comments.addExpense') + item.cost + "PLN"
                          : item.notificationType === 'addGiveBackTime'
                              ? t('notifications.comments.addGiveBackTime') + formatDateToString(item.date)
                              : item.notificationType === 'giveBackCar'
                                  ? t('notifications.comments.giveBackCar')
                                  : ''
                }}
              </p>

              <span>
                {{ item.description }}
              </span>

            </div>
          </v-timeline-item>

        </v-timeline>
        <div
            v-if="isCompany && !isFixEnd"
            align="center"
            class="mt-5"
        >
          <v-btn @click="isAddStatus=true">
            {{ t('notifications.addStatus') }}
          </v-btn>
        </div>

        <div
            v-if="isAddStatus"
            class="mt-4"
        >
          <v-form
              v-if="!loading"
              ref="form"
              @submit.prevent="addNotification"
              v-model="valid"
          >
            <v-row>
              <v-col cols="12" md="6" sm="12">
                <v-select
                    v-model="addNotificationStatus"
                    :label="t('fixStatues.title')"
                    :items="notificationsType"
                    :rules="[requiredRule(t), requiredArrayRule(t)]"
                />
              </v-col>

              <v-col
                  v-if="addNotificationStatus === 'addExpense'"
                  cols="12"
                  md="6"
                  sm="12"
              >
                <v-text-field
                    v-model.number="notificationCost"
                    min="1"
                    type="number"
                    :label="t('notifications.expense')"
                    :rules="[requiredRule(t)]"
                    suffix="PLN"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" md="6" sm="12">
                <VueDatePicker
                    class="my-3"
                    v-model="notificationDate"
                    :dark="isDark"
                    :time-picker-inline="true"
                    :min-date="fix.bookDate"
                    :auto-apply="true"
                    :disabled="notificationIsCurrentDate"
                    auto-position="top"
                />

              </v-col>
              <v-col cols="12" md="6" sm="12">
                <v-checkbox
                    v-model="notificationIsCurrentDate"
                    color="primary"
                    :label="t('notifications.setCurrantDate')"
                />
              </v-col>

            </v-row>

            <v-row>
              <v-col cols="12" md="4" sm="12">
                <v-checkbox
                    v-model="isNotificationDescription"
                    color="primary"
                    :label="t('notifications.addDescription')"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-textarea
                    v-if="isNotificationDescription"
                    v-model="notificationDescription"
                    color="primary"
                    :label="t('notifications.description')"
                />
              </v-col>
            </v-row>

            <v-row class="w-100 justify-end my-2">
              <v-btn
                  color="primary"
                  class="mx-1"
                  @click="addNotification()"
              >
                {{ t('universal.add') }}
              </v-btn>

              <v-btn
                  color="error"
                  class="mx-1"
                  @click="resetAddStatus()"
              >
                {{ t('universal.cancel') }}
              </v-btn>
            </v-row>
          </v-form>

          <div v-if="loading" align="center" class="mt-5">
            <v-progress-circular
                :size="50"
                color="primary"
                indeterminate
            />

          </div>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn
            color="default"
            @click="close"
        >
          {{ t('universal.close') }}
        </v-btn>

      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
