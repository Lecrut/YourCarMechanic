<script setup lang="ts">
import PageHeader from '~/components/pageHeader.vue'
import { CONTACT_CATEGORIES, CONTACT_LIMITS } from '~/domain/contactMessage'
import type { ContactCategory } from '~/types/contactMessage'
import formValidation from '~/utils/formValidation'
import { emailRule, maxLengthRule, requiredRule } from '~/utils/rules'

/** Contact form for guests and signed-in users – messages land in the moderator's inbox. */
const { t } = useI18n()
const { form, valid, isValid } = formValidation()

const authStore = useAuthStore()
const contactStore = useContactStore()
const { loading, error } = storeToRefs(useSharedStore())

const profileName = () => [authStore.user?.profile?.name, authStore.user?.profile?.surname].filter(Boolean).join(' ')

const name = ref(profileName())
const email = ref(authStore.user?.email ?? '')
const category = ref<ContactCategory>('general')
const subject = ref('')
const message = ref('')
/** Honeypot – invisible to people, bots tend to fill every field. */
const website = ref('')
const sent = ref(false)

const categories = computed(() => CONTACT_CATEGORIES.map(value => ({ value, title: t(`contact.categories.${value}`) })))
const minLength = (v: string) => (v ?? '').trim().length >= CONTACT_LIMITS.messageMin || t('contact.messageTooShort', { min: CONTACT_LIMITS.messageMin })

async function submit() {
  if (website.value) {
    sent.value = true // pretend success for bots
    return
  }
  if (!(await isValid())) return
  await contactStore.send({
    name: name.value,
    email: email.value,
    category: category.value,
    subject: subject.value,
    message: message.value,
    userRef: authStore.user?.reference ?? '',
  })
  if (!error.value) sent.value = true
}

function another() {
  subject.value = ''
  message.value = ''
  sent.value = false
}
</script>

<template>
  <div>
    <v-container class="py-8">
      <page-header
        :title="t('contact.title')"
        :subtitle="t('contact.subtitle')"
        icon="mdi-email-outline"
      />

      <v-row>
        <v-col
          cols="12"
          md="8"
        >
          <v-card
            class="pa-6"
            elevation="2"
          >
            <v-fade-transition mode="out-in">
              <v-empty-state
                v-if="sent"
                icon="mdi-email-check-outline"
                color="success"
                :title="t('contact.sentTitle')"
                :text="t('contact.sentText', { email })"
                data-testid="contact-sent"
              >
                <template #actions>
                  <v-btn
                    variant="tonal"
                    @click="another"
                  >
                    {{ t('contact.another') }}
                  </v-btn>
                </template>
              </v-empty-state>

              <v-form
                v-else
                ref="form"
                v-model="valid"
                :disabled="loading"
                @submit.prevent="submit"
              >
                <v-row>
                  <v-col
                    cols="12"
                    md="6"
                  >
                    <v-text-field
                      v-model="name"
                      :label="t('contact.name')"
                      prepend-inner-icon="mdi-account-outline"
                      autocomplete="name"
                      :counter="CONTACT_LIMITS.name"
                      :rules="[requiredRule(t), maxLengthRule(t, CONTACT_LIMITS.name)]"
                      data-testid="contact-name"
                    />
                  </v-col>
                  <v-col
                    cols="12"
                    md="6"
                  >
                    <v-text-field
                      v-model="email"
                      type="email"
                      :label="t('contact.email')"
                      prepend-inner-icon="mdi-email-outline"
                      autocomplete="email"
                      :rules="[requiredRule(t), emailRule(t)]"
                      data-testid="contact-email"
                    />
                  </v-col>
                  <v-col
                    cols="12"
                    md="5"
                  >
                    <v-select
                      v-model="category"
                      :items="categories"
                      :label="t('contact.category')"
                      prepend-inner-icon="mdi-tag-outline"
                      data-testid="contact-category"
                    />
                  </v-col>
                  <v-col
                    cols="12"
                    md="7"
                  >
                    <v-text-field
                      v-model="subject"
                      :label="t('contact.subject')"
                      :counter="CONTACT_LIMITS.subject"
                      :rules="[maxLengthRule(t, CONTACT_LIMITS.subject)]"
                      data-testid="contact-subject"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-textarea
                      v-model="message"
                      :label="t('contact.message')"
                      rows="6"
                      auto-grow
                      :counter="CONTACT_LIMITS.messageMax"
                      :rules="[requiredRule(t), minLength, maxLengthRule(t, CONTACT_LIMITS.messageMax)]"
                      data-testid="contact-message"
                    />
                  </v-col>
                  <v-col
                    cols="12"
                    class="d-none"
                    aria-hidden="true"
                  >
                    <v-text-field
                      v-model="website"
                      label="Website"
                      tabindex="-1"
                      autocomplete="off"
                    />
                  </v-col>
                </v-row>

                <div class="d-flex align-center flex-wrap ga-4">
                  <p class="text-body-small text-medium-emphasis">
                    {{ t('contact.privacy') }}
                  </p>
                  <v-spacer />
                  <v-btn
                    type="submit"
                    size="large"
                    prepend-icon="mdi-send"
                    :loading="loading"
                    data-testid="contact-submit"
                  >
                    {{ t('contact.send') }}
                  </v-btn>
                </div>
              </v-form>
            </v-fade-transition>
          </v-card>
        </v-col>

        <v-col
          cols="12"
          md="4"
        >
          <v-card
            variant="tonal"
            color="primary"
            class="pa-6 h-100"
          >
            <div class="text-title-large font-weight-bold mb-4">
              {{ t('contact.howWeHelp') }}
            </div>
            <v-list
              bg-color="transparent"
              density="comfortable"
            >
              <v-list-item
                prepend-icon="mdi-clock-fast"
                :title="t('contact.responseTime')"
                :subtitle="t('contact.responseTimeText')"
              />
              <v-list-item
                prepend-icon="mdi-garage"
                :title="t('contact.forWorkshops')"
                :subtitle="t('contact.forWorkshopsText')"
              />
              <v-list-item
                prepend-icon="mdi-bug-outline"
                :title="t('contact.bugs')"
                :subtitle="t('contact.bugsText')"
              />
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
