<script setup lang="ts">
import {services} from "~/composable/services";

definePageMeta({
  layout: 'company',
  middleware: ['company'],
})

const {t} = useI18n()

const authStore = useAuthStore()
const {company} = storeToRefs(authStore)

const fixStore = useFixesStore()
const {fixes, historyFixes} = storeToRefs(fixStore)

const sharedStore = useSharedStore()
const {loading} = storeToRefs(sharedStore)

const searchedServices = ref([])
const checkboxToBeAccepted = ref(false)
const checkboxActiveFixes = ref(true)

const isHistoryFixesSearched = ref(false)

const fixesList = computed(() => {
  let filteredFixes = checkboxActiveFixes.value ? fixes.value : historyFixes.value

  if (searchedServices.value.length > 0) {
    filteredFixes = filteredFixes.filter(fix =>
        searchedServices.value.some(service =>
            fix.services.includes(service)
        )
    )
  }

  if (checkboxToBeAccepted.value && checkboxActiveFixes.value) {
    filteredFixes = filteredFixes.filter(fix =>
        fix.notifications.length === 0
    )
  }

  return filteredFixes
});

onMounted(async () => {
  if (company.value)
    await fixStore.getWorkshopFixes(company.value)
})

watch(checkboxActiveFixes, async (newValue) => {
  if (!newValue) {
    if (company.value && !isHistoryFixesSearched.value)
      await fixStore.getWorkshopHistoryFixes(company.value)

    isHistoryFixesSearched.value = true
  }
})
</script>

<template>
  <v-container class="h-auto my-15">
    <v-card
        class="pa-5"
    >
      <v-card-text>
        <div class="text-h5 text-center mb-5">
          {{ t('company.title') }}
        </div>

        <v-row>
          <v-col cols="12" md="6" sm="12">
            <v-select
                v-model="searchedServices"
                :label="t('company.services')"
                :items="services(t)"
                chips
                multiple
                clearable
            />
          </v-col>

          <v-col cols="12" md="3" sm="6" xs="12">
            <v-switch
                v-model="checkboxToBeAccepted"
                color="primary"
                :label="t('company.toBeAccepted')"
                :disabled="!checkboxActiveFixes"
            />
          </v-col>

          <v-col cols="12" md="3" sm="6" xs="12">
            <v-switch
                v-model="checkboxActiveFixes"
                color="primary"
                :label="t('company.activeFixes')"
            />
          </v-col>
        </v-row>

        <v-row justify="center">
          <v-col
              v-for="(item) in fixesList"
              cols="12"
              lg="4"
              md="6"
              sm="12"
          >
            <repair-card
                :is-company="true"
                :fix="item"
            />
          </v-col>
        </v-row>

        <div v-if="loading" align="center" class="mt-5">
          <v-progress-circular
              :size="50"
              color="primary"
              indeterminate
          />
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>
