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
    <div class="hidden-md-and-up ml-2 font-weight-bold">
      {{ t('navBar.title') }}
    </div>

    <div class="hidden-sm-and-down">
      <v-btn variant="text" color="default" to="/">
        {{ t('navBar.title') }}
      </v-btn>
    </div>

    <v-spacer/>

    <div class="hidden-sm-and-down">
      <v-btn variant="text" color="default" to="/user">
        {{ t('navBar.user.bookedFix') }}
      </v-btn>

    </div>

    <v-btn class="rounded-xl mr-2" color="default">
      <v-icon icon="mdi-account-circle"/>

      <v-menu activator="parent">
        <v-list class="justify-center">
          <v-list-item prepend-icon="mdi-account" to="/user/profile">
            <v-list-item-title>
              {{ t('navBar.user.profile') }}
            </v-list-item-title>
          </v-list-item>

          <v-list-item prepend-icon="mdi-history" to="/user/history" class="hidden-sm-and-down">
            <v-list-item-title>
              {{ t('navBar.user.history') }}
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
    <div class="hidden-sm-and-down">

      <v-btn variant="text" color="default" to="/user/notifications" icon="mdi-bell"/>
    </div>

  </v-app-bar>


  <v-bottom-navigation
      color="primary"
      :elevation="10"
      class="hidden-md-and-up"
      grow
  >
    <v-btn to="/user/notifications">
      <v-icon>mdi-bell</v-icon>

      {{ t('navBar.notifications') }}
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
