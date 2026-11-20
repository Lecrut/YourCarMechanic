<script setup lang="ts">
/** Renders a static Markdown document (terms, privacy policy) inside a card with Vuetify typography. */
const props = defineProps<{ source: string }>()

const blocks = computed(() => parseMarkdown(props.source))

const headingClass = {
  1: 'text-headline-small font-weight-bold mb-4',
  2: 'text-title-large font-weight-bold mt-6 mb-2',
  3: 'text-title-medium font-weight-bold mt-4 mb-2',
}
</script>

<template>
  <v-card
    border
    elevation="0"
  >
    <v-card-text class="text-body-medium">
      <template
        v-for="(block, i) in blocks"
        :key="i"
      >
        <component
          :is="`h${block.level}`"
          v-if="block.type === 'heading'"
          :class="headingClass[block.level]"
        >
          <span
            v-for="(span, j) in block.spans"
            :key="j"
            :class="{ 'font-weight-bold': span.bold }"
          >{{ span.text }}</span>
        </component>
        <p
          v-else-if="block.type === 'paragraph'"
          class="mb-3"
        >
          <span
            v-for="(span, j) in block.spans"
            :key="j"
            :class="{ 'font-weight-bold': span.bold }"
          >{{ span.text }}</span>
        </p>
        <component
          :is="block.ordered ? 'ol' : 'ul'"
          v-else
          class="ps-6 mb-3"
        >
          <li
            v-for="(item, j) in block.items"
            :key="j"
            class="mb-1"
          >
            <span
              v-for="(span, k) in item"
              :key="k"
              :class="{ 'font-weight-bold': span.bold }"
            >{{ span.text }}</span>
          </li>
        </component>
      </template>
    </v-card-text>
  </v-card>
</template>
