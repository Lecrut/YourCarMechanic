<script setup lang="ts">
import type { IReview } from '~/models/review'
import { formatDateToString } from '~/utils/time'

const { t } = useI18n()

const reviewsStore = useReviewsStore()
const { all } = storeToRefs(reviewsStore)
const moderatorStore = useModeratorStore()
const { loading } = storeToRefs(useSharedStore())

const search = ref('')
const maxRating = ref<number | null>(null)

const items = computed(() =>
  maxRating.value ? all.value.filter(r => r.rating <= maxRating.value!) : all.value,
)

const headers = computed(() => [
  { title: t('moderator.date'), key: 'createdAt', value: (r: IReview) => r.createdAt.getTime() },
  { title: t('userBookFix.stepper.fourth.workshop'), key: 'company', value: (r: IReview) => moderatorStore.workshopName(r.companyRef) },
  { title: t('moderator.client'), key: 'author', value: (r: IReview) => `${r.authorName} ${moderatorStore.userEmail(r.userRef)}` },
  { title: t('reviews.rating'), key: 'rating' },
  { title: t('reviews.comment'), key: 'comment', sortable: false },
  { title: t('workshopStatus.label'), key: 'state', sortable: false },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
])

const ratingFilters = computed(() => [
  { title: t('reviews.filterAll'), value: null },
  { title: t('reviews.filterLow'), value: 2 },
  { title: t('reviews.filterMid'), value: 3 },
])
</script>

<template>
  <v-row class="mb-2">
    <v-col
      cols="12"
      md="8"
    >
      <v-text-field
        v-model="search"
        :label="t('moderator.search')"
        prepend-inner-icon="mdi-magnify"
        clearable
        hide-details
      />
    </v-col>
    <v-col
      cols="12"
      md="4"
    >
      <v-select
        v-model="maxRating"
        :items="ratingFilters"
        :label="t('reviews.rating')"
        prepend-inner-icon="mdi-star-half-full"
        hide-details
      />
    </v-col>
  </v-row>

  <v-data-table
    :headers="headers"
    :items="items"
    :search="search"
    :loading="loading"
    :sort-by="[{ key: 'createdAt', order: 'desc' }]"
    item-value="reference"
    hover
    data-testid="reviews-table"
  >
    <template #[`item.createdAt`]="{ item }">
      {{ formatDateToString(item.createdAt) }}
    </template>

    <template #[`item.author`]="{ item }">
      <div>{{ item.authorName || '—' }}</div>
      <div class="text-body-small text-medium-emphasis">
        {{ moderatorStore.userEmail(item.userRef) }}
      </div>
    </template>

    <template #[`item.rating`]="{ item }">
      <v-rating
        :model-value="item.rating"
        readonly
        density="compact"
        size="small"
        color="amber"
      />
    </template>

    <template #[`item.comment`]="{ item }">
      <span :class="item.deletedAt || item.hidden ? 'text-disabled' : ''">{{ item.comment || '—' }}</span>
    </template>

    <template #[`item.state`]="{ item }">
      <v-chip
        v-if="item.deletedAt"
        color="error"
        size="small"
        variant="tonal"
      >
        {{ t('moderator.deleted') }}
      </v-chip>
      <v-chip
        v-else-if="item.hidden"
        color="warning"
        size="small"
        variant="tonal"
      >
        {{ t('reviews.hidden') }}
      </v-chip>
      <v-chip
        v-else
        color="success"
        size="small"
        variant="tonal"
      >
        {{ t('reviews.visible') }}
      </v-chip>
    </template>

    <template #[`item.actions`]="{ item }">
      <div class="d-flex justify-end">
        <v-btn
          v-if="item.deletedAt"
          v-tooltip="t('moderator.restore')"
          icon="mdi-restore"
          variant="text"
          size="small"
          color="success"
          :aria-label="t('moderator.restore')"
          @click="reviewsStore.restore(item)"
        />
        <template v-else>
          <v-btn
            v-tooltip="item.hidden ? t('reviews.show') : t('reviews.hide')"
            :icon="item.hidden ? 'mdi-eye' : 'mdi-eye-off'"
            variant="text"
            size="small"
            color="warning"
            :aria-label="item.hidden ? t('reviews.show') : t('reviews.hide')"
            data-testid="toggle-review"
            @click="reviewsStore.setHidden(item, !item.hidden)"
          />
          <v-btn
            v-tooltip="t('moderator.delete')"
            icon="mdi-delete"
            variant="text"
            size="small"
            color="error"
            :aria-label="t('moderator.delete')"
            @click="reviewsStore.remove(item)"
          />
        </template>
      </div>
    </template>

    <template #no-data>
      <v-empty-state
        icon="mdi-star-off-outline"
        :title="t('reviews.empty')"
      />
    </template>
  </v-data-table>
</template>
