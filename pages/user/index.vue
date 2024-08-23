<script setup lang="ts">

definePageMeta({
  layout: 'user',
})
const { t } = useI18n()

const currentStep = ref('1')

</script>

<template>
  <v-container class="h-auto my-15">
    <v-row justify="center">
      <v-stepper
          v-model="currentStep"
          alt-labels
          class="stepper my-10 w-100 max-w-1000px"
          elevation="8"
      >
        <template #default="{ prev, next }">
          <v-stepper-header>
            <v-stepper-item
                :title="t('userBookFix.stepper.chooseRepair')"
                value="1"
                color="secondary"
            />

            <v-divider />

            <v-stepper-item
                :title="t('userBookFix.stepper.chooseCar')"
                value="2" color="secondary"
            />

            <v-divider />

            <v-stepper-item
                :title="t('userBookFix.stepper.chooseMechanic')"
                value="3"
                color="secondary"
            />
          </v-stepper-header>

          <v-stepper-window>
            <v-stepper-window-item value="1">
              <v-form ref="credentialsForm">
                <div class="py-4">

                </div>
              </v-form>
            </v-stepper-window-item>

            <v-stepper-window-item value="2">
              <v-form ref="infoForm">
                <div class="py-4">

                </div>
              </v-form>
            </v-stepper-window-item>

            <v-stepper-window-item value="3">
              <div class="py-4">

              </div>
            </v-stepper-window-item>
          </v-stepper-window>

          <v-stepper-actions
              :next-text="t('userBookFix.stepper.nextStep')"
              :prev-text="t('userBookFix.stepper.prevStep')"
              @click:prev="prev"
              @click:next="next"
          />
        </template>
      </v-stepper>
    </v-row>

  </v-container>
</template>
