<script setup lang="ts">
import { MAX_PHOTOS } from '~/domain/fix'
import type { IFix, ViewerMode } from '~/types/fix'
import { formatDateToString } from '~/utils/time'

/** Photos of a repair – the client shows the problem, the mechanic documents the work. */
const props = defineProps<{
  fix: IFix
  mode: ViewerMode
}>()

const { t } = useI18n()
const fixesStore = useFixesStore()
const { loading } = storeToRefs(useSharedStore())

const input = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const viewer = ref(false)
const current = ref(0)

const canUpload = computed(() => props.mode !== 'moderator' && !props.fix.isClosed && props.fix.photos.length < MAX_PHOTOS)
const byColor: Record<string, string> = { user: 'primary', workshop: 'secondary', moderator: 'warning' }

async function onFiles(event: Event) {
  const target = event.target as HTMLInputElement
  const files = [...(target.files ?? [])]
  target.value = ''
  if (!files.length) return
  uploading.value = true
  await fixesStore.addPhotos(props.fix, files, props.mode)
  uploading.value = false
}

function openViewer(index: number) {
  current.value = index
  viewer.value = true
}
</script>

<template>
  <div data-testid="repair-photos">
    <div class="text-title-large mb-3 d-flex align-center ga-2">
      <v-icon
        icon="mdi-image-multiple-outline"
        color="primary"
      />
      {{ t('photos.title') }}
      <v-chip
        size="x-small"
        variant="tonal"
      >
        {{ fix.photos.length }}/{{ MAX_PHOTOS }}
      </v-chip>
      <v-spacer />
      <template v-if="canUpload">
        <input
          ref="input"
          type="file"
          accept="image/*"
          multiple
          hidden
          data-testid="photo-input"
          @change="onFiles"
        >
        <v-btn
          size="small"
          variant="tonal"
          prepend-icon="mdi-camera-plus-outline"
          :loading="uploading && loading"
          data-testid="add-photo"
          @click="input?.click()"
        >
          {{ t('photos.add') }}
        </v-btn>
      </template>
    </div>

    <v-row
      v-if="fix.photos.length"
      dense
    >
      <v-col
        v-for="(photo, index) in fix.photos"
        :key="photo.path"
        cols="4"
        sm="3"
        md="2"
      >
        <v-card
          hover
          rounded="lg"
          data-testid="photo-thumb"
          @click="openViewer(index)"
        >
          <v-img
            :src="photo.url"
            aspect-ratio="1"
            cover
          >
            <v-chip
              :color="byColor[photo.by]"
              size="x-small"
              variant="flat"
              class="ma-1"
            >
              {{ t(`photos.by.${photo.by}`) }}
            </v-chip>
          </v-img>
        </v-card>
      </v-col>
    </v-row>
    <p
      v-else
      class="text-body-medium text-medium-emphasis"
    >
      {{ mode === 'user' ? t('photos.emptyClient') : t('photos.emptyWorkshop') }}
    </p>

    <v-dialog
      v-model="viewer"
      max-width="1000"
    >
      <v-card>
        <v-carousel
          v-model="current"
          height="70vh"
          hide-delimiter-background
          show-arrows="hover"
        >
          <v-carousel-item
            v-for="photo in fix.photos"
            :key="photo.path"
            :src="photo.url"
          />
        </v-carousel>
        <v-card-actions>
          <span
            v-if="fix.photos[current]"
            class="text-body-small text-medium-emphasis ml-2"
          >
            {{ t(`photos.by.${fix.photos[current]!.by}`) }} · {{ formatDateToString(fix.photos[current]!.at) }}
          </span>
          <v-spacer />
          <v-btn
            variant="text"
            color="default"
            @click="viewer = false"
          >
            {{ t('universal.close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
