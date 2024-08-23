<script setup lang="ts">
  const { t } = useI18n()

  //todo: jeżeli zalogowany to od razu przenosi do index

</script>

<template>
  <v-container class="h-auto my-15">
    <v-sheet
      class="d-flex align-center justify-center flex-wrap text-center mx-auto my-10 px-4"
      elevation="4"
      max-width="1100"
      rounded
  >
    <v-row justify="center">
      <v-col cols="12" sm="12" md="6" class="hidden-sm-and-down">
        <div class="d-flex flex-column align-center justify-center h-100 pa-6">
          <v-img
              class="mx-auto my-5 elevation-5"
              rounded="xl"
              :width="300"
              aspect-ratio="4/3"
              cover
              src="/reset.jpg"
          />
        </div>
      </v-col>
      <v-col cols="12" sm="12" md="6">
        <div class="d-flex flex-column align-center justify-center h-100 mx-2 py-4">
          <div class="text-h5 my-2">
            {{ t('resetPassword.title') }}
          </div>

          <p>{{ t('resetPassword.text') }}</p>

          <form class="w-75 my-2">
            <v-text-field
                :label="t('resetPassword.email')"
                placeholder="example@mail.com"
                type="email"
            />

            <v-btn>
              {{ t('resetPassword.button') }}
            </v-btn>
          </form>
        </div>
      </v-col>
    </v-row>
  </v-sheet>
  </v-container>
</template>
