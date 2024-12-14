<script setup lang="ts">
import type {IFix} from "~/models/fix";
import CarCard from "~/components/user/carCard.vue";
import type {Ref} from "vue";
import type {IWorkshop} from "~/models/workshop";
import WorkshopCard from "~/components/user/workshopCard.vue";
import {services} from "~/composable/services";
import {formatDateToString} from "~/helpers/time";

const isDialogShown = defineModel<boolean>()

const props = defineProps<{
  fix: IFix
  isCompany: boolean
}>()

const {fix, isCompany} = toRefs(props)

const {t} = useI18n()
const workshopsStore = useWorkshopStore()

const workshop: Ref<IWorkshop | null> = ref(null)


function close() {
  isDialogShown.value = false
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
            
          </v-col>
        </v-row>
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
