<script setup lang="ts">
import { mapIWorkshop } from '~/models/workshop'
import WorkshopForm from '~/components/workshopForm.vue'
import type { ValidatableForm } from '~/utils/formValidation'
import PageHeader from '~/components/pageHeader.vue'

definePageMeta({ middleware: ['auth'], role: 'workshop' })

const { t } = useI18n()

const authStore = useAuthStore()
const { user, company } = storeToRefs(authStore)
const sharedStore = useSharedStore()
const { error, loading } = storeToRefs(sharedStore)

const isEditing = ref(false)
const showSuccess = ref(false)
const draft = ref(mapIWorkshop(company.value ?? {}))
const workshopFormRef = ref<ValidatableForm | null>(null)

function cancel() {
  draft.value = mapIWorkshop(company.value ?? {})
  isEditing.value = false
}

async function save() {
  if (!(await workshopFormRef.value?.isValid())) return
  await authStore.updateCompany(draft.value)
  if (!error.value) {
    showSuccess.value = true
    isEditing.value = false
  }
}

watch(company, value => (draft.value = mapIWorkshop(value ?? {})))
</script>

<template>
  <div>
    <v-container class="py-8">
      <page-header
        :title="t('companyProfile.title')"
        icon="mdi-domain"
      >
        <v-btn
          v-if="!isEditing"
          prepend-icon="mdi-pencil"
          data-testid="edit-company"
          @click="isEditing = true"
        >
          {{ t('universal.edit') }}
        </v-btn>
      </page-header>

      <v-card
        class="pa-6"
        elevation="2"
      >
        <workshop-form
          ref="workshopFormRef"
          v-model="draft"
          :readonly="!isEditing"
          :email="user?.email"
        />

        <v-expand-transition>
          <div
            v-if="isEditing"
            class="d-flex justify-end ga-2 mt-2"
          >
            <v-btn
              variant="text"
              color="default"
              @click="cancel"
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
          </div>
        </v-expand-transition>
      </v-card>
    </v-container>
    <my-snackbar
      v-model="showSuccess"
      :is-error="false"
      :text="t('userProfile.updateProfileSuccess')"
    />
  </div>
</template>
