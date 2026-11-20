<script setup lang="ts">
import { type IService, mapIService, SERVICE_CATEGORIES } from '~/models/service'
import { requiredRule } from '~/utils/rules'
import formValidation from '~/utils/formValidation'

const { t } = useI18n()

const servicesStore = useServicesStore()
const { catalog, missingDefaults } = storeToRefs(servicesStore)
const { loading, error } = storeToRefs(useSharedStore())
const { form, valid, isValid } = formValidation()

const search = ref('')
const categoryFilter = ref<string | null>(null)
const dialog = ref(false)
const isNew = ref(false)
const draft = ref<IService>(mapIService({}))

const categoryOptions = computed(() =>
  SERVICE_CATEGORIES.map(c => ({ title: t(`serviceCategories.${c}`), value: c })),
)

const filteredCatalog = computed(() =>
  categoryFilter.value ? catalog.value.filter(s => s.category === categoryFilter.value) : catalog.value,
)

const headers = computed(() => [
  { title: t('moderator.namePl'), key: 'namePl' },
  { title: t('moderator.nameEn'), key: 'nameEn' },
  { title: t('moderator.category'), key: 'category' },
  { title: t('moderator.order'), key: 'order' },
  { title: t('moderator.active'), key: 'active' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
])

/** Generates a unique camelCase Firestore key from the service name. */
function slugKey(source: string): string {
  const words = source
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  const base = words
    .map((w, i) => (i === 0 ? w.toLowerCase() : w[0]!.toUpperCase() + w.slice(1).toLowerCase()))
    .join('')
  const safe = /^[a-z]/.test(base) ? base : `service${base}`
  let candidate = safe
  let idx = 2
  while (catalog.value.some(s => s.key === candidate)) candidate = `${safe}${idx++}`
  return candidate
}

function add() {
  isNew.value = true
  draft.value = mapIService({ order: catalog.value.length })
  dialog.value = true
}

function edit(service: IService) {
  isNew.value = false
  draft.value = { ...service }
  dialog.value = true
}

async function save() {
  if (!(await isValid())) return
  if (isNew.value && !draft.value.key) {
    draft.value.key = slugKey(draft.value.nameEn || draft.value.namePl)
  }
  await servicesStore.save(draft.value)
  if (!error.value) dialog.value = false
}

const toggleActive = (service: IService) => servicesStore.save({ ...service, active: !service.active })
</script>

<template>
  <v-alert
    v-if="!catalog.length"
    type="info"
    variant="tonal"
    class="mb-4"
    :text="t('moderator.servicesEmpty')"
  >
    <template #append>
      <v-btn
        :loading="loading"
        data-testid="seed-services"
        @click="servicesStore.seedDefaults()"
      >
        {{ t('moderator.seedServices') }}
      </v-btn>
    </template>
  </v-alert>

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
      md="4"
    >
      <v-select
        v-model="categoryFilter"
        :items="categoryOptions"
        :label="t('moderator.category')"
        prepend-inner-icon="mdi-filter-variant"
        clearable
        hide-details
      />
    </v-col>
    <v-col
      cols="12"
      md="4"
      class="d-flex justify-md-end ga-2 flex-wrap"
    >
      <v-btn
        v-if="catalog.length && missingDefaults.length"
        variant="tonal"
        prepend-icon="mdi-playlist-plus"
        :loading="loading"
        data-testid="seed-missing-services"
        @click="servicesStore.seedDefaults()"
      >
        {{ t('moderator.seedMissing', { count: missingDefaults.length }) }}
      </v-btn>
      <v-btn
        prepend-icon="mdi-plus"
        data-testid="add-service"
        @click="add"
      >
        {{ t('moderator.addService') }}
      </v-btn>
    </v-col>
  </v-row>

  <v-data-table
    :headers="headers"
    :items="filteredCatalog"
    :search="search"
    :loading="loading"
    item-value="key"
    hover
    data-testid="services-table"
  >
    <template #[`item.namePl`]="{ item }">
      <span :class="item.deletedAt ? 'text-disabled text-decoration-line-through' : ''">{{ item.namePl }}</span>
      <v-chip
        v-if="item.deletedAt"
        size="x-small"
        color="error"
        variant="tonal"
        class="ml-2"
      >
        {{ t('moderator.deleted') }}
      </v-chip>
    </template>

    <template #[`item.category`]="{ item }">
      <v-chip
        size="small"
        variant="tonal"
      >
        {{ t(`serviceCategories.${item.category}`) }}
      </v-chip>
    </template>

    <template #[`item.active`]="{ item }">
      <v-switch
        v-tooltip:top="t('moderator.activeHint')"
        :disabled="!!item.deletedAt"
        :model-value="item.active"
        color="primary"
        hide-details
        density="compact"
        :data-testid="`toggle-${item.key}`"
        @update:model-value="toggleActive(item)"
      />
    </template>

    <template #[`item.actions`]="{ item }">
      <template v-if="item.deletedAt">
        <v-btn
          v-tooltip="t('moderator.restore')"
          icon="mdi-restore"
          variant="text"
          size="small"
          color="success"
          :aria-label="t('moderator.restore')"
          @click="servicesStore.restore(item.key)"
        />
      </template>
      <template v-else>
        <v-btn
          v-tooltip="t('universal.edit')"
          icon="mdi-pencil"
          variant="text"
          size="small"
          color="primary"
          :aria-label="t('universal.edit')"
          @click="edit(item)"
        />
        <v-btn
          v-tooltip="t('moderator.deleteServiceHint')"
          icon="mdi-delete"
          variant="text"
          size="small"
          color="error"
          :aria-label="t('moderator.delete')"
          @click="servicesStore.remove(item.key)"
        />
      </template>
    </template>
  </v-data-table>

  <v-dialog
    v-model="dialog"
    max-width="560"
  >
    <v-card :title="isNew ? t('moderator.addService') : t('moderator.editService')">
      <v-card-text>
        <v-form
          ref="form"
          v-model="valid"
        >
          <v-text-field
            v-model="draft.namePl"
            :label="t('moderator.namePl')"
            :rules="[requiredRule(t)]"
            data-testid="service-name-pl"
          />
          <v-text-field
            v-model="draft.nameEn"
            :label="t('moderator.nameEn')"
            :rules="[requiredRule(t)]"
            data-testid="service-name-en"
          />
          <v-select
            v-model="draft.category"
            :items="categoryOptions"
            :label="t('moderator.category')"
            data-testid="service-category"
          />
          <v-text-field
            v-model.number="draft.order"
            type="number"
            :label="t('moderator.order')"
          />
          <v-switch
            v-model="draft.active"
            color="primary"
            :label="t('moderator.active')"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          color="default"
          @click="dialog = false"
        >
          {{ t('universal.cancel') }}
        </v-btn>
        <v-btn
          :loading="loading"
          data-testid="save-service"
          @click="save"
        >
          {{ t('universal.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
