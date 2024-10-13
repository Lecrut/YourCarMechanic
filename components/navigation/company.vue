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

    <v-btn class="rounded-xl mr-2" color="default">
      <v-icon icon="mdi-account-circle"/>

      <v-menu activator="parent">
        <v-list class="justify-center">
          <v-list-item prepend-icon="mdi-account" to="/company/profile">
            <v-list-item-title>
              {{ t('navBar.user.profile') }}
            </v-list-item-title>
          </v-list-item>
          
          <v-divider/>

          <v-list-item prepend-icon="mdi-logout" @click="logOut">
            <v-list-item-title>
              {{ t('navBar.logOut') }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-btn>

  </v-app-bar>
</template>
