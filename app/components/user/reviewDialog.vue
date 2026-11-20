<script setup lang="ts">
import type { IFix } from '~/types/fix'
import { maxLengthRule } from '~/utils/rules'

const isDialogShown = defineModel<boolean>({ default: false })

const props = defineProps<{ fix: IFix }>()

const { t } = useI18n()
const reviewsStore = useReviewsStore()
const { loading, error } = storeToRefs(useSharedStore())

const rating = ref(5)
const comment = ref('')

async function submit() {
  await reviewsStore.addReview(props.fix, rating.value, comment.value)
  if (!error.value) {
    isDialogShown.value = false
    comment.value = ''
  }
}
</script>

<template>
  <v-dialog
    v-model="isDialogShown"
    max-width="520"
  >
    <v-card
      :title="t('reviews.title')"
      :subtitle="`${fix.car.manufacturer} ${fix.car.model}`"
      prepend-icon="mdi-star-outline"
    >
      <v-card-text class="text-center">
        <v-rating
          v-model="rating"
          color="amber"
          hover
          size="x-large"
          data-testid="review-rating"
        />
        <v-textarea
          v-model="comment"
          class="mt-4"
          :label="t('reviews.comment')"
          rows="3"
          auto-grow
          counter="500"
          :rules="[maxLengthRule(t, 500)]"
          data-testid="review-comment"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          color="default"
          @click="isDialogShown = false"
        >
          {{ t('universal.cancel') }}
        </v-btn>
        <v-btn
          :loading="loading"
          :disabled="comment.length > 500"
          data-testid="submit-review"
          @click="submit"
        >
          {{ t('reviews.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
