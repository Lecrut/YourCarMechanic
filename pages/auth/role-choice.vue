<script setup lang="ts">
import {roles} from "~/composable/roles";
import {requiredRule} from "~/helpers/rules";

definePageMeta({
  layout: 'no-role',
})

const {t} = useI18n()

const selectedRole = ref(null)

function chooseRole() {

}
</script>

<template>
  <v-container class="h-auto my-15">
    <v-sheet
        class="align-center justify-center text-center mx-auto my-10 px-4 py-5"
        elevation="4"
        max-width="1100"
        rounded
    >
      <div class="text-h5 my-4">
        {{ t('noRole.chooseRole') }}
      </div>
      <v-divider/>

      <v-radio-group
          v-model="selectedRole"
          class="my-5"
          color="primary"
          :rules="requiredRule(t)"
      >
        <v-row justify="center">
          <v-col
              cols="12"
              md="6"
              lg="4"
              sm="12"
              v-for="(role, index) in roles(t)"
              :key="index"
          >
            <v-card variant="tonal" rounded="xl">
              <v-card-title>
                <v-radio :label="role.title" :value="role.value"></v-radio>
              </v-card-title>
            </v-card>

          </v-col>
        </v-row>
      </v-radio-group>

      <div>
        <v-btn
            :disabled="!selectedRole"
            @click="chooseRole"
        >
          {{ t('noRole.select') }}
        </v-btn>
      </div>

    </v-sheet>
  </v-container>
</template>