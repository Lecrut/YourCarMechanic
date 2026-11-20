<script setup lang="ts">
import { CONTACT_CATEGORIES, CONTACT_STATUSES, type ContactStatus, type IContactMessage, isOpen, replyLink } from '~/models/contactMessage'
import { formatDateToString } from '~/utils/time'

/** Moderator inbox of contact-form messages (live). */
const { t } = useI18n()
const contactStore = useContactStore()
const { messages } = storeToRefs(contactStore)
const { loading } = storeToRefs(useSharedStore())

type View = 'open' | 'all' | 'deleted'
const view = ref<View>('open')
const category = ref<string | null>(null)
const search = ref('')
const selectedRef = ref<string | null>(null)
const note = ref('')

const selected = computed(() => messages.value.find(m => m.reference === selectedRef.value) ?? null)

const statusMeta: Record<ContactStatus, { color: string, icon: string }> = {
  new: { color: 'error', icon: 'mdi-email-alert-outline' },
  inProgress: { color: 'warning', icon: 'mdi-progress-clock' },
  resolved: { color: 'success', icon: 'mdi-check-circle-outline' },
}

const items = computed(() => messages.value.filter((m) => {
  if (view.value === 'open' && !isOpen(m)) return false
  if (view.value === 'all' && m.deletedAt) return false
  if (view.value === 'deleted' && !m.deletedAt) return false
  return !category.value || m.category === category.value
}))

const categoryOptions = computed(() => CONTACT_CATEGORIES.map(value => ({ value, title: t(`contact.categories.${value}`) })))

const headers = computed(() => [
  { title: t('moderator.date'), key: 'createdAt', value: (m: IContactMessage) => m.createdAt.getTime() },
  { title: t('messages.from'), key: 'from', value: (m: IContactMessage) => `${m.name} ${m.email}` },
  { title: t('contact.category'), key: 'category' },
  { title: t('contact.subject'), key: 'subject', value: (m: IContactMessage) => `${m.subject} ${m.message}` },
  { title: t('workshopStatus.label'), key: 'status' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
])

function open(m: IContactMessage) {
  selectedRef.value = m.reference
  note.value = m.moderatorNote
  // Opening a new message means somebody is on it.
  if (m.status === 'new') contactStore.setStatus(m, 'inProgress')
}
</script>

<template>
  <v-row class="mb-2 align-center">
    <v-col
      cols="12"
      md="4"
    >
      <v-btn-toggle
        v-model="view"
        mandatory
        variant="outlined"
        density="comfortable"
        color="primary"
        data-testid="messages-view"
      >
        <v-btn value="open">
          {{ t('messages.open') }}
          <v-badge
            v-if="contactStore.openCount"
            :content="contactStore.openCount"
            color="error"
            inline
          />
        </v-btn>
        <v-btn value="all">
          {{ t('messages.all') }}
        </v-btn>
        <v-btn value="deleted">
          {{ t('moderator.deleted') }}
        </v-btn>
      </v-btn-toggle>
    </v-col>
    <v-col
      cols="12"
      md="3"
    >
      <v-select
        v-model="category"
        :items="categoryOptions"
        :label="t('contact.category')"
        prepend-inner-icon="mdi-tag-outline"
        clearable
        hide-details
      />
    </v-col>
    <v-col
      cols="12"
      md="5"
    >
      <v-text-field
        v-model="search"
        :label="t('moderator.search')"
        prepend-inner-icon="mdi-magnify"
        clearable
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
    data-testid="messages-table"
    @click:row="(_: unknown, row: { item: IContactMessage }) => open(row.item)"
  >
    <template #[`item.createdAt`]="{ item }">
      <span class="text-no-wrap">{{ formatDateToString(item.createdAt) }}</span>
    </template>

    <template #[`item.from`]="{ item }">
      <div class="font-weight-medium">
        {{ item.name }}
      </div>
      <div class="text-body-small text-medium-emphasis">
        {{ item.email }}
        <v-icon
          v-if="item.userRef"
          v-tooltip="t('messages.registered')"
          icon="mdi-account-check"
          size="x-small"
          color="primary"
        />
      </div>
    </template>

    <template #[`item.category`]="{ item }">
      <v-chip
        size="small"
        variant="tonal"
      >
        {{ t(`contact.categories.${item.category}`) }}
      </v-chip>
    </template>

    <template #[`item.subject`]="{ item }">
      <div :class="item.status === 'new' ? 'font-weight-bold' : ''">
        {{ item.subject || t('messages.noSubject') }}
      </div>
      <div class="text-body-small text-medium-emphasis text-truncate">
        {{ item.message.slice(0, 90) }}{{ item.message.length > 90 ? '…' : '' }}
      </div>
    </template>

    <template #[`item.status`]="{ item }">
      <v-chip
        :color="statusMeta[item.status].color"
        :prepend-icon="statusMeta[item.status].icon"
        size="small"
        variant="flat"
        data-testid="message-status"
      >
        {{ t(`messages.status.${item.status}`) }}
      </v-chip>
    </template>

    <template #[`item.actions`]="{ item }">
      <div
        class="d-flex justify-end"
        @click.stop
      >
        <v-btn
          v-tooltip="t('messages.reply')"
          icon="mdi-reply"
          variant="text"
          size="small"
          color="primary"
          :href="replyLink(item)"
          :aria-label="t('messages.reply')"
        />
        <v-btn
          v-if="item.deletedAt"
          v-tooltip="t('moderator.restore')"
          icon="mdi-restore"
          variant="text"
          size="small"
          color="success"
          :aria-label="t('moderator.restore')"
          @click="contactStore.restore(item)"
        />
        <v-btn
          v-else
          v-tooltip="t('moderator.delete')"
          icon="mdi-delete"
          variant="text"
          size="small"
          color="error"
          :aria-label="t('moderator.delete')"
          @click="contactStore.remove(item)"
        />
      </div>
    </template>

    <template #no-data>
      <v-empty-state
        icon="mdi-email-check-outline"
        :title="view === 'open' ? t('messages.inboxZero') : t('messages.empty')"
      />
    </template>
  </v-data-table>

  <v-dialog
    :model-value="Boolean(selected)"
    max-width="720"
    scrollable
    @update:model-value="selectedRef = null"
  >
    <v-card
      v-if="selected"
      :title="selected.subject || t('messages.noSubject')"
      :subtitle="`${selected.name} <${selected.email}> · ${formatDateToString(selected.createdAt)}`"
      prepend-icon="mdi-email-open-outline"
      data-testid="message-detail"
    >
      <v-card-text>
        <div class="d-flex flex-wrap ga-2 mb-4">
          <v-chip
            size="small"
            variant="tonal"
          >
            {{ t(`contact.categories.${selected.category}`) }}
          </v-chip>
          <v-chip
            v-if="selected.userRef"
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-account-check"
          >
            {{ t('messages.registered') }}
          </v-chip>
        </div>

        <v-sheet
          border
          class="pa-4 mb-4 text-body-large"
        >
          <p
            v-for="(line, index) in selected.message.split('\n')"
            :key="index"
          >
            {{ line }}
          </p>
        </v-sheet>

        <div class="text-title-small mb-2">
          {{ t('workshopStatus.label') }}
        </div>
        <v-btn-toggle
          :model-value="selected.status"
          mandatory
          variant="outlined"
          density="comfortable"
          class="mb-4"
          data-testid="message-status-toggle"
          @update:model-value="(s: ContactStatus) => contactStore.setStatus(selected!, s)"
        >
          <v-btn
            v-for="s in CONTACT_STATUSES"
            :key="s"
            :value="s"
            :color="statusMeta[s].color"
            :prepend-icon="statusMeta[s].icon"
          >
            {{ t(`messages.status.${s}`) }}
          </v-btn>
        </v-btn-toggle>

        <v-textarea
          v-model="note"
          :label="t('messages.note')"
          :hint="t('notes.internalHint')"
          persistent-hint
          prepend-inner-icon="mdi-lock-outline"
          rows="2"
          auto-grow
          data-testid="message-note"
        />
      </v-card-text>
      <v-card-actions>
        <v-btn
          variant="text"
          color="default"
          @click="selectedRef = null"
        >
          {{ t('universal.close') }}
        </v-btn>
        <v-spacer />
        <v-btn
          variant="tonal"
          :disabled="note === selected.moderatorNote"
          :loading="loading"
          data-testid="save-message-note"
          @click="contactStore.saveNote(selected, note)"
        >
          {{ t('messages.saveNote') }}
        </v-btn>
        <v-btn
          prepend-icon="mdi-reply"
          :href="replyLink(selected)"
          data-testid="reply-message"
        >
          {{ t('messages.reply') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
