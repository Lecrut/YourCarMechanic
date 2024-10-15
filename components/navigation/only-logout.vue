<script setup lang="ts">
const {t} = useI18n()

function logOut() {
}
</script>

<template>
  <v-app-bar
      prominent
      position-fixed
      class="px-2"
  >
    <v-btn variant="text" color="default" to="/company">
      {{ t('navBar.title') }}
    </v-btn>

    <v-spacer/>

    <v-btn variant="text" color="default" prepend-icon="mdi-logout" @click="logOut">
      {{ t('navBar.logOut') }}
    </v-btn>

  </v-app-bar>
</template>
