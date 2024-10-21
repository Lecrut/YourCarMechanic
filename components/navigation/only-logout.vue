<script setup lang="ts">
import {useAuthStore} from "~/stores/authStore";

const {t} = useI18n()

const authStore = useAuthStore()

function logOut() {
  authStore.logOut()
  navigateTo('/')
}

</script>

<template>
  <v-app-bar
      prominent
      position-fixed
      class="px-2"
  >
    <v-btn variant="text" color="default" to="/">
      {{ t('navBar.title') }}
    </v-btn>

    <v-spacer/>

    <v-btn variant="text" color="default" prepend-icon="mdi-logout" @click="logOut">
      {{ t('navBar.logOut') }}
    </v-btn>

  </v-app-bar>
</template>
