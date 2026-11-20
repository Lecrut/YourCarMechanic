<script setup lang="ts">
/** Two-column card used by the login / register / reset-password pages. */
defineProps<{
  title: string
  image: string
  imageFirst?: boolean
}>()
</script>

<template>
  <v-container class="py-12">
    <v-card
      class="mx-auto overflow-hidden"
      max-width="1000"
      elevation="3"
    >
      <v-row
        no-gutters
        :class="imageFirst ? '' : 'flex-row-reverse'"
      >
        <v-col
          cols="12"
          md="6"
          class="d-none d-md-block"
        >
          <v-img
            :src="image"
            height="100%"
            min-height="480"
            cover
            gradient="to top, rgba(0,0,0,.35), rgba(0,0,0,0)"
          />
        </v-col>
        <v-col
          cols="12"
          md="6"
        >
          <div class="pa-8 pa-md-10 d-flex flex-column justify-center h-100">
            <h1 class="text-headline-medium font-weight-bold mb-6 text-center">
              {{ title }}
            </h1>
            <slot />
          </div>
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>
