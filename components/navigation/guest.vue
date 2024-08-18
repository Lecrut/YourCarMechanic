<script setup lang="ts">
import { useTheme } from 'vuetify'

const { t, locale } = useI18n()

const theme = useTheme()
function toggleTheme() {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}

function changeLocale(lang: string) {
  locale.value = lang
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

    <v-spacer />

    <div class="hidden-sm-and-down">
      <v-btn variant="text" color="default" to="/auth/login">
        {{ t('navBar.login') }}
      </v-btn>

      <v-btn variant="text" color="default" to="/about">
        {{ t('navBar.about') }}
      </v-btn>
    </div>

    <v-btn class="rounded-xl mr-2" color="default">
      <v-icon icon="mdi-translate" />
      <v-menu activator="parent">
        <v-list class="justify-center">

          <v-list-item @click="changeLocale('pl')">
            <v-list-item-title>{{ t('navBar.polish') }}</v-list-item-title>
          </v-list-item>

          <v-list-item @click="changeLocale('en')">
            <v-list-item-title>{{ t('navBar.english') }}</v-list-item-title>
          </v-list-item>

        </v-list>
      </v-menu>
    </v-btn>

    <v-btn variant="text" color="default" icon="mdi-theme-light-dark" @click="toggleTheme" />
  </v-app-bar>


  <v-bottom-navigation
      color="primary"
      :elevation="10"
      class="hidden-md-and-up"
      grow
  >
    <v-btn to="/auth/login">
      <v-icon>mdi-login</v-icon>

      {{ t('navBar.login') }}
    </v-btn>

    <v-btn to="/">
      <v-icon>mdi-home</v-icon>

      {{ t('navBar.home') }}
    </v-btn>

    <v-btn to="/about">
      <v-icon>mdi-information-variant</v-icon>

      {{ t('navBar.about') }}
    </v-btn>
  </v-bottom-navigation>
</template>
