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

const isDialogShown = defineModel<boolean>()

const props = defineProps<{
  fix: IFix
  isCompany: boolean
}>()

const {fix, isCompany} = toRefs(props)

const {t} = useI18n()
const workshopsStore = useWorkshopStore()
const fixesStore = useFixesStore()

const sharedStore = useSharedStore()
const {error} = storeToRefs(sharedStore)

const {form, valid, isValid} = formValidation()

const workshop: Ref<IWorkshop | null> = ref(null)
const isAddStatus = ref(false)
const addNotificationStatus = ref(null)
const notificationDate = ref(new Date)
const notificationIsCurrentDate = ref(false)

const notificationsType = computed(() => {
  return fix.value.notifications.length ? duringNotification(t) : startNotification(t)
})

function resetAddStatus() {
  isAddStatus.value = false
  addNotificationStatus.value = null
  notificationDate.value = new Date()
  notificationIsCurrentDate.value = false
}

async function addNotification() {
  if (await isValid()) {
    await fixesStore.addNotification(
        fix.value,
        mapINotification(
            {
              sendDate: new Date(),
              notificationType: addNotificationStatus.value || '',
              cost: null,
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

        <div align="center" class="text-h5 my-4">
          {{ t('fixStatues.title') }}
        </div>

        <!--      todo:  https://vuetifyjs.com/en/components/timelines/#icon-dots-->


        <div align="center">
          <v-btn @click="isAddStatus=true">
            Dodaj status
          </v-btn>
        </div>

        <div v-if="isAddStatus">
          <v-form
              ref="form"
              @submit.prevent="addNotification"
              v-model="valid"
          >
            <!--          todo: add rules to check-->
            <v-row>
              <v-col cols="12" md="6" sm="12">
                <v-select
                    v-model="addNotificationStatus"
                    :label="t('fixStatues.title')"
                    :items="notificationsType"
                    :rules="[requiredRule(t), requiredArrayRule(t)]"
                />
              </v-col>
              <v-col cols="12" md="6" sm="12">
                <VueDatePicker
                    class="my-3"
                    v-model="notificationDate"
                    :dark="true"
                    :time-picker-inline="true"
                    :min-date="fix.bookDate"
                    :auto-apply="true"
                    :disabled="notificationIsCurrentDate"
                />
                <!--              todo: format datepicker: theme-->

              </v-col>
              <v-col cols="12" md="6" sm="12">
                <v-checkbox
                    v-model="notificationIsCurrentDate"
                    color="primary"
                    :label="t('notifications.setCurrantDate')"
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
