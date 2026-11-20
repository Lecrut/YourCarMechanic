<script setup lang="ts">
import PageHeader from '~/components/pageHeader.vue'
import AccountSettingsCard from '~/components/accountSettingsCard.vue'
import { useModeratorLive } from '~/composables/useModeratorLive'
import { mapIUserProfile } from '~/mappers/userProfile'
import formValidation from '~/utils/formValidation'
import { phoneRule, requiredRule } from '~/utils/rules'

definePageMeta({ middleware: ['auth'], role: 'moderator' })
// Keeps the panel's live data (and the badges in the navigation) running here too.
useModeratorLive()

const { t } = useI18n()

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const { error, loading } = storeToRefs(useSharedStore())
const { form, valid, isValid } = formValidation()

const isEditing = ref(false)
const showSuccess = ref(false)
const profile = ref(mapIUserProfile(user.value?.profile ?? {}))

function cancel() {
  profile.value = mapIUserProfile(user.value?.profile ?? {})
  isEditing.value = false
}

async function updateProfile() {
  if (!(await isValid())) return
  await authStore.updateUserProfile(profile.value)
  if (!error.value) {
    showSuccess.value = true
    isEditing.value = false
  }
}

watch(user, value => (profile.value = mapIUserProfile(value?.profile ?? {})))
</script>

<template>
  <div>
    <v-container class="py-8">
      <page-header
        :title="t('userProfile.title')"
        :subtitle="user?.email"
        icon="mdi-account"
      />

      <v-row>
        <v-col cols="12">
          <v-card
            class="pa-6"
            elevation="2"
          >
            <v-form
              ref="form"
              v-model="valid"
              :readonly="!isEditing"
              @submit.prevent="updateProfile"
            >
              <v-text-field
                v-model="profile.name"
                :label="t('userProfile.userName')"
                prepend-inner-icon="mdi-account-outline"
                :rules="[requiredRule(t)]"
              />
              <v-text-field
                v-model="profile.surname"
                :label="t('userProfile.userSurname')"
                prepend-inner-icon="mdi-account-outline"
                :rules="[requiredRule(t)]"
              />
              <v-text-field
                v-model="profile.phone"
                :label="t('userProfile.userPhone')"
                prepend-inner-icon="mdi-phone-outline"
                :rules="[requiredRule(t), phoneRule(t)]"
              />
            </v-form>

            <div class="d-flex justify-end ga-2">
              <v-btn
                v-if="!isEditing"
                prepend-icon="mdi-pencil"
                @click="isEditing = true"
              >
                {{ t('universal.edit') }}
              </v-btn>
              <template v-else>
                <v-btn
                  variant="text"
                  color="default"
                  @click="cancel"
                >
                  {{ t('universal.cancel') }}
                </v-btn>
                <v-btn
                  :loading="loading"
                  @click="updateProfile"
                >
                  {{ t('universal.save') }}
                </v-btn>
              </template>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12">
          <account-settings-card />
        </v-col>
      </v-row>
    </v-container>

    <my-snackbar
      v-model="showSuccess"
      :is-error="false"
      :text="t('userProfile.updateProfileSuccess')"
    />
  </div>
</template>
