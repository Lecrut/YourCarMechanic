<script setup lang="ts">
import type { IFix, ViewerMode } from '~/models/fix'
import { maxLengthRule } from '~/utils/rules'

/**
 * Workshop notes on a repair: one visible to the client, one internal (workshop + moderator only).
 * The internal note is a separate Firestore document the client has no read access to.
 */
const props = defineProps<{
  fix: IFix
  mode: ViewerMode
}>()

const { t } = useI18n()
const fixesStore = useFixesStore()
const { loading, error } = storeToRefs(useSharedStore())

const canEdit = computed(() => props.mode === 'workshop')
const seesInternal = computed(() => props.mode !== 'user')

const publicNote = ref(props.fix.workshopNote)
const internalNote = ref('')
const savedInternal = ref('')
const saved = ref(false)

const publicDirty = computed(() => publicNote.value !== props.fix.workshopNote)
const internalDirty = computed(() => internalNote.value !== savedInternal.value)

async function savePublic() {
  await fixesStore.setPublicNote(props.fix, publicNote.value.trim())
  if (!error.value) saved.value = true
}

async function saveInternal() {
  await fixesStore.setInternalNote(props.fix.reference, internalNote.value.trim())
  if (!error.value) {
    savedInternal.value = internalNote.value.trim()
    saved.value = true
  }
}

onMounted(async () => {
  if (!seesInternal.value) return
  const text = await fixesStore.getInternalNote(props.fix.reference)
  internalNote.value = text ?? ''
  savedInternal.value = text ?? ''
})

// The public note can change through the live listener (e.g. edited in another tab).
watch(() => props.fix.workshopNote, (value) => {
  if (!publicDirty.value) publicNote.value = value
})
</script>

<template>
  <!-- Client: just the note, if there is one -->
  <v-alert
    v-if="mode === 'user'"
    v-show="fix.workshopNote"
    type="info"
    variant="tonal"
    icon="mdi-message-text-outline"
    :title="t('notes.fromWorkshop')"
    :text="fix.workshopNote"
    data-testid="public-note"
  />

  <div v-else>
    <div class="text-title-large mb-3 d-flex align-center ga-2">
      <v-icon
        icon="mdi-note-text-outline"
        color="primary"
      />
      {{ t('notes.title') }}
    </div>

    <v-row>
      <v-col
        cols="12"
        md="6"
      >
        <v-textarea
          v-model="publicNote"
          :label="t('notes.public')"
          :hint="t('notes.publicHint')"
          persistent-hint
          prepend-inner-icon="mdi-account-eye-outline"
          rows="3"
          auto-grow
          counter="1000"
          :readonly="!canEdit"
          :rules="[maxLengthRule(t, 1000)]"
          data-testid="public-note-input"
        />
        <div
          v-if="canEdit"
          class="d-flex justify-end mt-2"
        >
          <v-btn
            size="small"
            :disabled="!publicDirty || publicNote.length > 1000"
            :loading="loading"
            data-testid="save-public-note"
            @click="savePublic"
          >
            {{ t('universal.save') }}
          </v-btn>
        </div>
      </v-col>

      <v-col
        v-if="seesInternal"
        cols="12"
        md="6"
      >
        <v-textarea
          v-model="internalNote"
          :label="t('notes.internal')"
          :hint="t('notes.internalHint')"
          persistent-hint
          prepend-inner-icon="mdi-lock-outline"
          rows="3"
          auto-grow
          counter="2000"
          bg-color="surface-variant"
          :readonly="!canEdit"
          :rules="[maxLengthRule(t, 2000)]"
          data-testid="internal-note-input"
        />
        <div
          v-if="canEdit"
          class="d-flex justify-end mt-2"
        >
          <v-btn
            size="small"
            variant="tonal"
            :disabled="!internalDirty || internalNote.length > 2000"
            :loading="loading"
            data-testid="save-internal-note"
            @click="saveInternal"
          >
            {{ t('universal.save') }}
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <my-snackbar
      v-model="saved"
      :is-error="false"
      :text="t('notes.saved')"
    />
  </div>
</template>
