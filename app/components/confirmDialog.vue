<script setup lang="ts">
/** "Are you sure?" dialog for destructive actions: cancel (text) on the left, the action on the right. */
const shown = defineModel<boolean>({ default: false })

withDefaults(defineProps<{
  title: string
  text?: string
  confirmText?: string
  icon?: string
  color?: string
}>(), { text: '', confirmText: '', icon: 'mdi-alert-outline', color: 'error' })

const emit = defineEmits<{ confirm: [] }>()

const { t } = useI18n()
const { loading } = storeToRefs(useSharedStore())

function confirm() {
  emit('confirm')
  shown.value = false
}
</script>

<template>
  <v-dialog
    v-model="shown"
    max-width="440"
  >
    <v-card
      :title="title"
      :text="text"
      :prepend-icon="icon"
    >
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          color="default"
          @click="shown = false"
        >
          {{ t('universal.cancel') }}
        </v-btn>
        <v-btn
          :color="color"
          :loading="loading"
          data-testid="confirm-action"
          @click="confirm"
        >
          {{ confirmText || t('moderator.delete') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
