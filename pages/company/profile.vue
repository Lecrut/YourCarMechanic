<script setup lang="ts">
definePageMeta({
  layout: 'company',
})

const {t} = useI18n()

const isEditing = ref(false)

function saveForm() {
  isEditing.value = false
}
</script>

<template>
  <v-container class="h-auto my-15">

    <v-sheet
        class="mx-auto my-10 pa-4"
        elevation="4"
        max-width="1100"
        rounded
    >
      <v-row justify="center">
        <div class="text-h5 my-5">
          {{ t('companyProfile.title') }}
        </div>
      </v-row>

      <v-row justify="center">
        <v-col cols="12" sm="12" md="6">
          <v-text-field
              :label="t('companyProfile.name')"
              :readonly="!isEditing"
          />
        </v-col>

        <v-col cols="12" sm="12" md="6">
          <v-text-field
              :label="t('companyProfile.nip')"
              :readonly="!isEditing"
          />
        </v-col>

        <v-col cols="12" sm="12" md="6">
          <v-text-field
              :label="t('companyProfile.phone')"
              :readonly="!isEditing"
          />
        </v-col>

        <v-col cols="12" sm="12" md="6">
          <v-text-field
              :label="t('companyProfile.email')"
              :readonly="!isEditing"
          />
        </v-col>

        <v-col cols="12" sm="12" md="6">
          <v-text-field
              :label="t('companyProfile.address')"
              :readonly="!isEditing"
          />
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-text-field
              :label="t('companyProfile.openingTime')"
              :readonly="!isEditing"
          />
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-text-field
              :label="t('companyProfile.closingTime')"
              :readonly="!isEditing"
          />
        </v-col>

        <v-col cols="12" sm="12">
          <v-select
              :label="t('companyProfile.services')"
              chips
              multiple
              :readonly="!isEditing"
          ></v-select>
        </v-col>
      </v-row>

      <v-row
          v-if="!isEditing"
          justify="center"
          class="mb-5">
        <v-btn
            prepend-icon="mdi-pencil"
            @click="isEditing=true"
        >
          {{ t('universal.edit') }}
        </v-btn>
      </v-row>

      <v-row
          v-else
          justify="center"
          class="mb-5"
      >
        <v-btn
            class="mx-2"
            color="default"
            variant="outlined"
            @click="isEditing=false"
        >
          {{ t('universal.cancel') }}
        </v-btn>

        <v-btn
            class="mx-2"
            @click="saveForm"
        >
          {{ t('universal.save') }}
        </v-btn>
      </v-row>
    </v-sheet>
  </v-container>

</template>
