<script setup lang="ts">
import { type IWorkshop, mapIWorkshop, type WorkshopStatus } from '~/models/workshop'
import type { IUser } from '~/models/user'
import { formatDateToString } from '~/utils/time'
import WorkshopForm from '~/components/workshopForm.vue'
import type { ValidatableForm } from '~/utils/formValidation'
import { emailRule } from '~/utils/rules'

const { t } = useI18n()

const moderatorStore = useModeratorStore()
const { workshops, users } = storeToRefs(moderatorStore)
const citiesJsonStore = useCitiesJsonStore()
const servicesStore = useServicesStore()
const { loading, error } = storeToRefs(useSharedStore())

const search = ref('')
const statusFilter = ref<WorkshopStatus | null>(null)
const showDeleted = ref(false)
const editDialog = ref(false)
const isNew = ref(false)
const deleteDialog = ref(false)
const draft = ref<IWorkshop>(mapIWorkshop({}))
const ownerMode = ref<'email' | 'existing'>('email')
const ownerEmail = ref('')
const ownerRef = ref<string | null>(null)
const toDelete = ref<IWorkshop | null>(null)
const workshopFormRef = ref<ValidatableForm | null>(null)

const statusMeta: Record<WorkshopStatus, { color: string, icon: string }> = {
  pending: { color: 'warning', icon: 'mdi-lock-clock' },
  approved: { color: 'success', icon: 'mdi-check-decagram' },
  suspended: { color: 'error', icon: 'mdi-cancel' },
}

const statusOptions = computed(() =>
  (['pending', 'approved', 'suspended'] as WorkshopStatus[]).map(s => ({ title: t(`workshopStatus.${s}`), value: s })),
)

/** Users who could own a new company: registered and not tied to another company. */
const ownerOptions = computed(() =>
  users.value
    .filter(u => !u.companyRef && u.role !== 'moderator')
    .map(u => ({ title: u.profile?.name ? `${u.profile.name} ${u.profile.surname} (${u.email})` : u.email, value: u.reference })),
)

const items = computed(() =>
  workshops.value.filter(w =>
    (showDeleted.value ? Boolean(w.deletedAt) : !w.deletedAt)
    && (!statusFilter.value || w.status === statusFilter.value),
  ),
)

const ownerEmailOf = (w: IWorkshop) =>
  users.value.find(u => u.reference === `users/${w.ownerUid}` || u.companyRef === w.reference)?.email ?? ''

const headers = computed(() => [
  { title: t('companyProfile.name'), key: 'name' },
  { title: t('userProfile.email'), key: 'ownerEmail', value: (w: IWorkshop) => ownerEmailOf(w) },
  { title: t('workshopStatus.label'), key: 'status' },
  { title: t('companyProfile.nip'), key: 'nip' },
  { title: t('companyProfile.city'), key: 'city', value: (w: IWorkshop) => citiesJsonStore.getCityName(w.city) },
  { title: t('companyProfile.phone'), key: 'phone', sortable: false },
  { title: t('companyProfile.services'), key: 'services', sortable: false },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
])

function add() {
  isNew.value = true
  ownerMode.value = 'email'
  ownerEmail.value = ''
  ownerRef.value = null
  draft.value = mapIWorkshop({ openingTime: 8, closingTime: 16, status: 'approved' })
  editDialog.value = true
}

function edit(workshop: IWorkshop) {
  isNew.value = false
  draft.value = mapIWorkshop(workshop)
  editDialog.value = true
}

async function save() {
  const email = ownerMode.value === 'email' ? (ownerEmail.value.trim() || null) : null
  if (email && emailRule(t)(email) !== true) return
  if (!(await workshopFormRef.value?.isValid())) return
  const owner: IUser | null = ownerMode.value === 'existing'
    ? (users.value.find(u => u.reference === ownerRef.value) ?? null)
    : null
  if (isNew.value) await moderatorStore.createWorkshop(draft.value, owner, email)
  else await moderatorStore.updateWorkshop(draft.value)
  if (!error.value) editDialog.value = false
}

function askDelete(workshop: IWorkshop) {
  toDelete.value = workshop
  deleteDialog.value = true
}

async function confirmDelete() {
  if (toDelete.value) await moderatorStore.deleteWorkshop(toDelete.value)
  deleteDialog.value = false
}
</script>

<template>
  <v-row class="mb-4 align-center">
    <v-col
      cols="12"
      md="4"
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
      md="3"
    >
      <v-select
        v-model="statusFilter"
        :items="statusOptions"
        :label="t('workshopStatus.label')"
        prepend-inner-icon="mdi-filter-variant"
        clearable
        hide-details
        data-testid="status-filter"
      />
    </v-col>
    <v-col
      cols="12"
      md="2"
    >
      <v-switch
        v-model="showDeleted"
        color="error"
        hide-details
        :label="t('moderator.showDeleted')"
        data-testid="show-deleted"
      />
    </v-col>
    <v-col
      cols="12"
      md="3"
      class="d-flex justify-md-end"
    >
      <v-btn
        prepend-icon="mdi-domain-plus"
        data-testid="add-company"
        @click="add"
      >
        {{ t('moderator.addCompany') }}
      </v-btn>
    </v-col>
  </v-row>

  <v-data-table
    :headers="headers"
    :items="items"
    :search="search"
    :loading="loading"
    item-value="reference"
    hover
    data-testid="companies-table"
  >
    <template #[`item.name`]="{ item }">
      <span :class="item.deletedAt ? 'text-disabled text-decoration-line-through' : 'font-weight-medium'">{{ item.name }}</span>
    </template>

    <template #[`item.status`]="{ item }">
      <v-chip
        v-if="item.deletedAt"
        color="error"
        variant="tonal"
        size="small"
        prepend-icon="mdi-delete-clock"
      >
        {{ t('moderator.deleted') }}
      </v-chip>
      <v-chip
        v-else
        v-tooltip:top="item.contractSignedAt ? t('workshopStatus.contractSigned', { date: formatDateToString(item.contractSignedAt) }) : t(`workshopStatus.${item.status}Hint`)"
        :color="statusMeta[item.status].color"
        :prepend-icon="statusMeta[item.status].icon"
        size="small"
        variant="flat"
      >
        {{ t(`workshopStatus.${item.status}`) }}
      </v-chip>
    </template>

    <template #[`item.services`]="{ item }">
      <v-chip
        v-for="key in item.services"
        :key="key"
        size="small"
        variant="tonal"
        class="ma-1"
      >
        {{ servicesStore.label(key) }}
      </v-chip>
    </template>

    <template #[`item.actions`]="{ item }">
      <div
        v-if="item.deletedAt"
        class="d-flex justify-end"
      >
        <v-btn
          v-tooltip="t('moderator.restore')"
          icon="mdi-restore"
          variant="text"
          size="small"
          color="success"
          :aria-label="t('moderator.restore')"
          @click="moderatorStore.restoreWorkshop(item)"
        />
      </div>
      <div
        v-else
        class="d-flex justify-end"
      >
        <v-btn
          v-if="item.status !== 'approved'"
          v-tooltip="t('moderator.unlock')"
          icon="mdi-lock-open-check"
          variant="text"
          size="small"
          color="success"
          :aria-label="t('moderator.unlock')"
          data-testid="unlock-company"
          @click="moderatorStore.setWorkshopStatus(item, 'approved')"
        />
        <v-btn
          v-else
          v-tooltip="t('moderator.suspend')"
          icon="mdi-lock"
          variant="text"
          size="small"
          color="warning"
          :aria-label="t('moderator.suspend')"
          data-testid="suspend-company"
          @click="moderatorStore.setWorkshopStatus(item, 'suspended')"
        />
        <v-btn
          v-tooltip="t('universal.edit')"
          icon="mdi-pencil"
          variant="text"
          size="small"
          color="primary"
          :aria-label="t('universal.edit')"
          data-testid="edit-company"
          @click="edit(item)"
        />
        <v-btn
          v-tooltip="t('moderator.delete')"
          icon="mdi-delete"
          variant="text"
          size="small"
          color="error"
          :aria-label="t('moderator.delete')"
          data-testid="delete-company"
          @click="askDelete(item)"
        />
      </div>
    </template>

    <template #no-data>
      <v-empty-state
        icon="mdi-domain-off"
        :title="t('moderator.noCompanies')"
      />
    </template>
  </v-data-table>

  <v-dialog
    v-model="editDialog"
    max-width="900"
    scrollable
  >
    <v-card
      :title="isNew ? t('moderator.addCompany') : t('moderator.editCompany')"
      prepend-icon="mdi-domain"
    >
      <v-card-text>
        <v-row
          v-if="isNew"
          class="mb-2"
        >
          <v-col cols="12">
            <v-btn-toggle
              v-model="ownerMode"
              mandatory
              color="primary"
              variant="outlined"
              density="compact"
              rounded="pill"
            >
              <v-btn value="email">
                {{ t('moderator.ownerModeEmail') }}
              </v-btn>
              <v-btn value="existing">
                {{ t('moderator.ownerModeExisting') }}
              </v-btn>
            </v-btn-toggle>
          </v-col>
          <v-col
            cols="12"
            md="7"
          >
            <v-text-field
              v-if="ownerMode === 'email'"
              v-model="ownerEmail"
              type="email"
              :label="t('moderator.ownerEmail')"
              :hint="t('moderator.ownerEmailHint')"
              :rules="[v => !v || emailRule(t)(v)]"
              persistent-hint
              prepend-inner-icon="mdi-email-outline"
              clearable
              data-testid="company-owner-email"
            />
            <v-autocomplete
              v-else
              v-model="ownerRef"
              :items="ownerOptions"
              :label="t('moderator.owner')"
              :hint="t('moderator.ownerHint')"
              persistent-hint
              prepend-inner-icon="mdi-account-tie"
              clearable
              data-testid="company-owner"
            />
          </v-col>
          <v-col
            cols="12"
            md="5"
          >
            <v-select
              v-model="draft.status"
              :items="statusOptions"
              :label="t('workshopStatus.label')"
              prepend-inner-icon="mdi-file-sign"
            />
          </v-col>
        </v-row>

        <workshop-form
          ref="workshopFormRef"
          v-model="draft"
          nip-editable
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          color="default"
          @click="editDialog = false"
        >
          {{ t('universal.cancel') }}
        </v-btn>
        <v-btn
          :loading="loading"
          data-testid="save-company"
          @click="save"
        >
          {{ t('universal.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog
    v-model="deleteDialog"
    max-width="480"
  >
    <v-card
      :title="t('moderator.deleteCompanyTitle')"
      :text="t('moderator.deleteCompanyText', { name: toDelete?.name ?? '' })"
      prepend-icon="mdi-alert"
    >
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          color="default"
          @click="deleteDialog = false"
        >
          {{ t('universal.cancel') }}
        </v-btn>
        <v-btn
          color="error"
          :loading="loading"
          data-testid="confirm-delete"
          @click="confirmDelete"
        >
          {{ t('moderator.delete') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
