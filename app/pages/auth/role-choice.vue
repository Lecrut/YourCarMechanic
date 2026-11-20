<script setup lang="ts">
import { selectableRoles } from '~/utils/options'
import { phoneRule, requiredRule } from '~/utils/rules'
import formValidation from '~/utils/formValidation'
import { mapIUserProfile } from '~/mappers/userProfile'
import { mapIWorkshop } from '~/mappers/workshop'
import type { UserRole } from '~/types/user'
import WorkshopForm from '~/components/workshop/workshopForm.vue'
import type { ValidatableForm } from '~/utils/formValidation'

definePageMeta({ middleware: ['auth'] })

const { t } = useI18n()
const { form, valid, isValid } = formValidation()

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const sharedStore = useSharedStore()
const { error, loading } = storeToRefs(sharedStore)

const roleIcons: Record<string, string> = { user: 'mdi-account', workshop: 'mdi-garage' }

const selectedRole = ref<UserRole | null>(null)
const step = ref<'role' | 'details'>('role')

const profile = ref(mapIUserProfile({}))
const workshop = ref(mapIWorkshop({ openingTime: 8, closingTime: 16 }))
const workshopFormRef = ref<ValidatableForm | null>(null)

async function save() {
  if (selectedRole.value === 'user') {
    if (!(await isValid())) return
    await authStore.updateUserProfile(profile.value)
  }
  else {
    if (!(await workshopFormRef.value?.isValid())) return
    await authStore.createCompany(workshop.value)
  }
  if (!error.value) await navigateTo(authStore.homePath)
}

onMounted(() => {
  // Already configured accounts have nothing to do here (a workshop without a company may finish setup).
  if (authStore.role && (authStore.role !== 'workshop' || authStore.company)) navigateTo(authStore.homePath)
})
</script>

<template>
  <div>
    <v-container class="py-12">
      <v-card
        class="mx-auto pa-6"
        max-width="1000"
        elevation="3"
      >
        <v-card-title class="text-headline-small text-center text-wrap">
          {{
            step === 'role'
              ? t('noRole.chooseRole')
              : selectedRole === 'user' ? t('noRole.userProfile') : t('noRole.companyProfile')
          }}
        </v-card-title>

        <v-divider class="my-4" />

        <v-window v-model="step">
          <v-window-item value="role">
            <v-item-group
              v-model="selectedRole"
              mandatory
            >
              <v-row class="justify-center">
                <v-col
                  v-for="role in selectableRoles(t)"
                  :key="role.value"
                  cols="12"
                  sm="6"
                  md="4"
                >
                  <v-item
                    v-slot="{ isSelected, toggle }"
                    :value="role.value"
                  >
                    <v-card
                      :color="isSelected ? 'primary' : undefined"
                      :variant="isSelected ? 'flat' : 'tonal'"
                      class="pa-6 text-center"
                      hover
                      :data-testid="`role-${role.value}`"
                      @click="toggle"
                    >
                      <v-icon
                        :icon="roleIcons[role.value]"
                        size="48"
                        class="mb-2"
                      />
                      <div class="text-title-large">
                        {{ role.title }}
                      </div>
                    </v-card>
                  </v-item>
                </v-col>
              </v-row>
            </v-item-group>

            <div class="text-center mt-6">
              <v-btn
                :disabled="!selectedRole"
                size="large"
                append-icon="mdi-arrow-right"
                data-testid="choose-role"
                @click="step = 'details'"
              >
                {{ t('noRole.select') }}
              </v-btn>
            </div>
          </v-window-item>

          <v-window-item value="details">
            <v-sheet
              v-if="selectedRole === 'user'"
              max-width="480"
              color="transparent"
              class="mx-auto"
            >
              <v-form
                ref="form"
                v-model="valid"
                @submit.prevent="save"
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
            </v-sheet>

            <workshop-form
              v-else
              ref="workshopFormRef"
              v-model="workshop"
              nip-editable
              :email="user?.email"
            />

            <div class="d-flex justify-center ga-2 mt-4">
              <v-btn
                variant="text"
                color="default"
                prepend-icon="mdi-arrow-left"
                @click="step = 'role'"
              >
                {{ t('universal.cancel') }}
              </v-btn>
              <v-btn
                :loading="loading"
                data-testid="save-details"
                @click="save"
              >
                {{ t('universal.save') }}
              </v-btn>
            </div>
          </v-window-item>
        </v-window>
      </v-card>
    </v-container>
  </div>
</template>
