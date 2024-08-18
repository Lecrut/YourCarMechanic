<script setup lang="ts">
  const { t } = useI18n()
</script>

<template>
  <v-app-bar
      prominent
      position-fixed
      class="px-2"
  >
    <div class="hidden-md-and-up ml-2 font-weight-bold">
      {{ t('navBar.title') }}
    </div>

    <div class="hidden-sm-and-down">
      <v-btn variant="text" color="default" to="/user">
        {{ t('navBar.title') }}
      </v-btn>
    </div>

    <v-spacer />

    <div class="hidden-sm-and-down">
      <v-btn variant="text" color="default" to="/user/profile">
        {{ t('navBar.user.profile') }}
      </v-btn>

      <v-btn variant="text" color="default" to="/user/history">
        {{ t('navBar.user.history') }}
      </v-btn>
    </div>
  </v-app-bar>


  <v-bottom-navigation
      color="primary"
      :elevation="10"
      class="hidden-md-and-up"
      grow
  >
    <v-btn to="/user/profile">
      <v-icon>mdi-account</v-icon>

      {{ t('navBar.user.profile') }}
    </v-btn>

    <v-btn to="/user">
      <v-icon>mdi-home</v-icon>

      {{ t('navBar.user.bookedFix') }}
    </v-btn>

    <v-btn to="/user/history">
      <v-icon>mdi-history</v-icon>

      {{ t('navBar.user.history') }}
    </v-btn>
  </v-bottom-navigation>
</template>
