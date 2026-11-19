<script setup lang="ts">
/** Footer of the public pages (landing, about). */
const { t } = useI18n()
const year = new Date().getFullYear()

const links = computed(() => [
  { title: t('navBar.home'), to: '/' },
  { title: t('navBar.about'), to: '/about' },
  { title: t('navBar.login'), to: '/auth/login' },
  { title: t('register.button'), to: '/auth/register' },
])
</script>

<template>
  <v-footer
    border="t"
    class="py-8"
  >
    <v-container>
      <v-row class="align-center">
        <v-col
          cols="12"
          md="4"
          class="text-center text-md-start"
        >
          <div class="d-inline-flex align-center ga-2 mb-1">
            <v-avatar
              color="primary"
              size="30"
              rounded="lg"
            >
              <v-icon
                icon="mdi-car-wrench"
                size="18"
              />
            </v-avatar>
            <span class="text-title-medium font-weight-bold">{{ t('navBar.title') }}</span>
          </div>
          <p class="text-body-small text-medium-emphasis">
            {{ t('footer.tagline') }}
          </p>
        </v-col>

        <v-col
          cols="12"
          md="5"
          class="d-flex flex-wrap justify-center ga-1"
        >
          <v-btn
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            variant="text"
            color="default"
            size="small"
            rounded="xl"
          >
            {{ link.title }}
          </v-btn>
          <v-btn
            href="/Regulamin_Twoj_Mechanik.pdf"
            target="_blank"
            variant="text"
            color="default"
            size="small"
            rounded="xl"
            append-icon="mdi-open-in-new"
          >
            {{ t('footer.terms') }}
          </v-btn>
        </v-col>

        <v-col
          cols="12"
          md="3"
          class="text-center text-md-end text-body-small text-medium-emphasis"
        >
          © {{ year }} {{ t('navBar.title') }}
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
</template>
