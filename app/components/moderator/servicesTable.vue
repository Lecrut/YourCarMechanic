<script setup lang="ts">
import { type IService, mapIService } from '~/models/service'
import { requiredRule } from '~/utils/rules'
import formValidation from '~/utils/formValidation'

const { t } = useI18n()

const servicesStore = useServicesStore()
const { catalog } = storeToRefs(servicesStore)
const { loading, error } = storeToRefs(useSharedStore())
const { form, valid, isValid } = formValidation()

const dialog = ref(false)
const isNew = ref(false)
const draft = ref<IService>(mapIService({}))

const headers = computed(() => [
  { title: t('moderator.serviceKey'), key: 'key' },
  { title: t('moderator.namePl'), key: 'namePl' },
  { title: t('moderator.nameEn'), key: 'nameEn' },
  { title: t('moderator.order'), key: 'order' },
  { title: t('moderator.active'), key: 'active' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
])

const keyPattern = (v: string) => /^[a-z][a-zA-Z0-9]*$/.test(v) || t('rules.serviceKeyRule')
const uniqueKey = (v: string) => !isNew.value || !catalog.value.some(s => s.key === v) || t('rules.serviceKeyTaken')

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

  <div class="d-flex justify-end mb-4">
    <v-btn
      prepend-icon="mdi-plus"
      data-testid="add-service"
      @click="add"
    >
      {{ t('moderator.addService') }}
    </v-btn>
  </div>

  <v-data-table
    :headers="headers"
    :items="catalog"
    :loading="loading"
    item-value="key"
    hover
    data-testid="services-table"
  >
    <template #[`item.key`]="{ item }">
      <span :class="item.deletedAt ? 'text-disabled text-decoration-line-through' : ''">{{ item.key }}</span>
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
            v-model="draft.key"
            :label="t('moderator.serviceKey')"
            :readonly="!isNew"
            :hint="t('moderator.serviceKeyHint')"
            :rules="[requiredRule(t), keyPattern, uniqueKey]"
            data-testid="service-key"
          />
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
