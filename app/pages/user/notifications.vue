<script setup lang="ts">
import PageHeader from '~/components/pageHeader.vue'
import { awaitsClientDecision, nextVisit as findNextVisit } from '~/domain/fix'
import { buildGarage } from '~/domain/garage'
import NextVisit from '~/components/user/nextVisit.vue'
import GarageCar from '~/components/user/garageCar.vue'
import AddCarForm from '~/components/user/addCarForm.vue'

/** "My garage": a tile per car with its open repairs and history. */
definePageMeta({ middleware: ['auth'], role: 'user' })

const { t } = useI18n()

const authStore = useAuthStore()
const fixesStore = useFixesStore()
const { fixes, historyFixes, watching } = storeToRefs(fixesStore)
const carsStore = useCarsStore()
const { cars } = storeToRefs(carsStore)

const showAddCar = ref(false)
/** Grouping needs the saved cars – render tiles only once they are loaded (no jumping tiles). */
const ready = ref(false)

const decisions = computed(() => fixes.value.filter(awaitsClientDecision).length)
const upcoming = computed(() => findNextVisit(fixes.value))
// Live open repairs win over the (one-off) history copy of the same repair.
const garage = computed(() => buildGarage(cars.value, [...fixes.value, ...historyFixes.value.filter(h => !fixes.value.some(f => f.reference === h.reference))]))

// Live: statuses and proposals from the workshop appear without reloading.
onMounted(async () => {
  if (!authStore.user) return
  fixesStore.watchActive('userRef', authStore.user.reference)
  await Promise.all([
    fixesStore.getUserHistoryFixes(authStore.user.reference),
    carsStore.getUserCars(authStore.user.reference),
  ])
  ready.value = true
})
onUnmounted(() => fixesStore.stopWatching())
</script>

<template>
  <div>
    <v-container class="py-8">
      <page-header
        :title="t('garage.title')"
        :subtitle="t('garage.subtitle')"
        icon="mdi-garage-variant"
      >
        <v-btn
          variant="tonal"
          prepend-icon="mdi-plus"
          data-testid="garage-add-car"
          @click="showAddCar = true"
        >
          {{ t('userProfile.addCar') }}
        </v-btn>
        <v-btn
          to="/user"
          prepend-icon="mdi-calendar-plus"
        >
          {{ t('navBar.user.bookedFix') }}
        </v-btn>
      </page-header>

      <next-visit
        v-if="upcoming"
        :fix="upcoming"
      />

      <v-expand-transition>
        <v-alert
          v-if="decisions"
          type="warning"
          variant="tonal"
          icon="mdi-bell-alert"
          class="mb-6"
          :text="t('proposal.decisionsWaiting', { count: decisions })"
        />
      </v-expand-transition>

      <div
        v-if="!ready || (watching && !garage.length)"
        class="text-center py-10"
      >
        <v-progress-circular
          indeterminate
          color="primary"
          size="48"
        />
      </div>

      <v-empty-state
        v-else-if="!garage.length"
        icon="mdi-garage-open"
        :title="t('garage.emptyTitle')"
        :text="t('garage.emptyText')"
        data-testid="garage-empty"
      >
        <template #actions>
          <v-btn
            prepend-icon="mdi-plus"
            @click="showAddCar = true"
          >
            {{ t('userProfile.addCar') }}
          </v-btn>
        </template>
      </v-empty-state>

      <v-row v-else>
        <v-col
          v-for="tile in garage"
          :key="tile.key"
          cols="12"
          md="6"
          xl="4"
        >
          <garage-car :tile="tile" />
        </v-col>
      </v-row>
    </v-container>

    <add-car-form
      v-model="showAddCar"
      :car="null"
    />
  </div>
</template>
