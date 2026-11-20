<script setup lang="ts">
import type { LayerGroup, Map as LeafletMap, Marker, TileLayer } from 'leaflet'
import { useTheme } from 'vuetify'
import { type LatLng, POLAND_CENTER } from '~/models/geo'

export interface MapMarker {
  id: string
  position: LatLng
  label: string
  /** Shown as a small badge on the marker, e.g. "4.8". */
  badge?: string
  approximate?: boolean
}

/**
 * Leaflet map styled with Vuetify: round markers with rating badges, the user's position with
 * the search radius, theme-aware tiles and Vuetify map controls. Leaflet is loaded on demand.
 * `pickable` turns it into a location picker (click / drag a single pin).
 */
const props = withDefaults(defineProps<{
  markers?: MapMarker[]
  selectedId?: string | null
  highlightedId?: string | null
  origin?: LatLng | null
  radiusKm?: number | null
  pickable?: boolean
  picked?: LatLng | null
  height?: string | number
}>(), { markers: () => [], selectedId: null, highlightedId: null, origin: null, radiusKm: null, pickable: false, picked: null, height: 560 })

const emit = defineEmits<{
  select: [id: string]
  pick: [position: LatLng]
}>()

const { t } = useI18n()
const theme = useTheme()
const config = useRuntimeConfig().public.map as { lightTiles: string, darkTiles: string, attribution: string }

const container = ref<HTMLElement | null>(null)
const ready = ref(false)

let L: typeof import('leaflet') | null = null
let map: LeafletMap | null = null
let tiles: TileLayer | null = null
let markerLayer: LayerGroup | null = null
let originLayer: LayerGroup | null = null
let pickMarker: Marker | null = null

const tileUrl = computed(() => (theme.global.current.value.dark ? config.darkTiles : config.lightTiles))

/** Marker markup – Vuetify utility classes + the theme's surface colour as a ring. */
function markerHtml(m: MapMarker, state: 'normal' | 'highlighted' | 'selected') {
  const size = state === 'selected' ? 48 : state === 'highlighted' ? 44 : 38
  const color = state === 'normal' ? (m.approximate ? 'bg-blue-grey' : 'bg-primary') : 'bg-secondary'
  const badge = m.badge
    ? `<span class="position-absolute bg-amber text-black rounded-pill elevation-2 px-1 text-label-small font-weight-bold" style="top:-6px;right:-10px;line-height:16px"><i class="mdi mdi-star"></i>${m.badge}</span>`
    : ''
  return `<div class="position-relative d-flex align-center justify-center rounded-circle elevation-${state === 'normal' ? 3 : 5} ${color} text-white"
    style="width:${size}px;height:${size}px;border:3px solid rgb(var(--v-theme-surface));transition:all .15s">
    <i class="mdi mdi-garage" style="font-size:${size / 2}px"></i>${badge}</div>`
}

function renderMarkers() {
  if (!L || !map || !markerLayer) return
  markerLayer.clearLayers()
  for (const m of props.markers) {
    const state = m.id === props.selectedId ? 'selected' : m.id === props.highlightedId ? 'highlighted' : 'normal'
    const size = state === 'selected' ? 48 : state === 'highlighted' ? 44 : 38
    const marker = L.marker([m.position.lat, m.position.lng], {
      icon: L.divIcon({ className: '', html: markerHtml(m, state), iconSize: [size, size], iconAnchor: [size / 2, size / 2] }),
      title: m.label,
      riseOnHover: true,
      zIndexOffset: state === 'normal' ? 0 : 1000,
    })
    marker.bindTooltip(m.label, { direction: 'top', offset: [0, -size / 2], permanent: state === 'selected' })
    marker.on('click', () => emit('select', m.id))
    markerLayer.addLayer(marker)
  }
}

function renderOrigin() {
  if (!L || !map || !originLayer) return
  originLayer.clearLayers()
  if (!props.origin) return
  const primary = getComputedStyle(document.documentElement).getPropertyValue('--v-theme-primary').trim()
  const color = primary ? `rgb(${primary})` : '#0054db'
  if (props.radiusKm) {
    L.circle([props.origin.lat, props.origin.lng], {
      radius: props.radiusKm * 1000, color, weight: 1, opacity: 0.5, fillOpacity: 0.06, interactive: false,
    }).addTo(originLayer)
  }
  L.marker([props.origin.lat, props.origin.lng], {
    icon: L.divIcon({
      className: '',
      html: '<div class="rounded-circle elevation-4 bg-blue" style="width:18px;height:18px;border:3px solid white;box-shadow:0 0 0 8px rgba(33,150,243,.25)"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    }),
    interactive: false,
    keyboard: false,
  }).addTo(originLayer)
}

function renderPick() {
  if (!L || !map) return
  if (!props.pickable) return
  if (!props.picked) {
    pickMarker?.remove()
    pickMarker = null
    return
  }
  const latLng: [number, number] = [props.picked.lat, props.picked.lng]
  if (!pickMarker) {
    pickMarker = L.marker(latLng, {
      draggable: true,
      icon: L.divIcon({ className: '', html: markerHtml({ id: 'pick', position: props.picked, label: '' }, 'selected'), iconSize: [48, 48], iconAnchor: [24, 24] }),
    }).addTo(map)
    pickMarker.on('dragend', () => {
      const p = pickMarker!.getLatLng()
      emit('pick', { lat: p.lat, lng: p.lng })
    })
  }
  else pickMarker.setLatLng(latLng)
}

/** Shows everything relevant: the markers, the user and the radius. */
function fitView() {
  if (!L || !map) return
  if (props.pickable && props.picked) return map.setView([props.picked.lat, props.picked.lng], 15)
  const points: [number, number][] = props.markers.map(m => [m.position.lat, m.position.lng])
  if (props.origin) points.push([props.origin.lat, props.origin.lng])
  // Bounds from the origin, not the circle layer – the circle needs a map view to measure itself.
  if (props.origin && props.radiusKm)
    return map.fitBounds(L.latLng(props.origin.lat, props.origin.lng).toBounds(props.radiusKm * 2000), { padding: [24, 24] })
  if (points.length > 1) return map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 14 })
  if (points.length === 1) return map.setView(points[0]!, 13)
  map.setView([POLAND_CENTER.lat, POLAND_CENTER.lng], 6)
}

onMounted(async () => {
  const mod = await import('leaflet')
  // Leaflet is CommonJS – the namespace lives on `default` after Vite's interop.
  L = ((mod as unknown as { default?: typeof import('leaflet') }).default ?? mod) as typeof import('leaflet')
  await import('leaflet/dist/leaflet.css')
  if (!container.value) return
  map = L.map(container.value, { zoomControl: false, attributionControl: true, scrollWheelZoom: true })
  if (tileUrl.value)
    tiles = L.tileLayer(tileUrl.value, { attribution: config.attribution, maxZoom: 19, subdomains: 'abcd', detectRetina: true }).addTo(map)
  markerLayer = L.layerGroup().addTo(map)
  originLayer = L.layerGroup().addTo(map)
  if (props.pickable) map.on('click', e => emit('pick', { lat: e.latlng.lat, lng: e.latlng.lng }))
  renderOrigin()
  renderMarkers()
  renderPick()
  fitView()
  ready.value = true
})

onBeforeUnmount(() => {
  if (map) {
    // A pending zoom-animation timer would touch the removed panes (Leaflet 1.9) – it bails out when this is false.
    (map as unknown as { _animatingZoom: boolean })._animatingZoom = false
    map.remove()
  }
  map = null
})

watch(tileUrl, (url) => {
  if (url) tiles?.setUrl(url)
})
watch(() => [props.selectedId, props.highlightedId], renderMarkers)
watch(() => props.markers, () => {
  renderMarkers()
  fitView()
}, { deep: true })
watch(() => [props.origin, props.radiusKm], () => {
  renderOrigin()
  fitView()
}, { deep: true })
watch(() => props.picked, renderPick, { deep: true })
watch(() => props.selectedId, (id) => {
  const m = props.markers.find(x => x.id === id)
  if (m && map) map.panTo([m.position.lat, m.position.lng], { animate: true })
})

const zoomIn = () => map?.zoomIn()
const zoomOut = () => map?.zoomOut()
</script>

<template>
  <v-card
    class="position-relative overflow-hidden"
    rounded="xl"
    elevation="3"
    :height="height"
    data-testid="workshop-map"
  >
    <div
      ref="container"
      class="w-100 h-100"
    />

    <div
      class="position-absolute d-flex flex-column ga-2 ma-3"
      style="top:0;right:0;z-index:500"
    >
      <v-btn
        v-tooltip:left="t('map.zoomIn')"
        icon="mdi-plus"
        size="small"
        color="surface"
        elevation="3"
        :aria-label="t('map.zoomIn')"
        @click="zoomIn"
      />
      <v-btn
        v-tooltip:left="t('map.zoomOut')"
        icon="mdi-minus"
        size="small"
        color="surface"
        elevation="3"
        :aria-label="t('map.zoomOut')"
        @click="zoomOut"
      />
      <v-btn
        v-tooltip:left="t('map.fit')"
        icon="mdi-crosshairs-gps"
        size="small"
        color="surface"
        elevation="3"
        :aria-label="t('map.fit')"
        data-testid="map-fit"
        @click="fitView"
      />
    </div>

    <v-fade-transition>
      <div
        v-if="!ready"
        class="position-absolute d-flex align-center justify-center w-100 h-100 bg-surface-light"
        style="top:0;left:0;z-index:600"
      >
        <v-progress-circular
          indeterminate
          color="primary"
        />
      </div>
    </v-fade-transition>

    <v-chip
      v-if="pickable"
      class="position-absolute ma-3"
      style="bottom:0;left:50%;transform:translateX(-50%);z-index:500"
      color="surface"
      variant="flat"
      elevation="3"
      prepend-icon="mdi-gesture-tap"
    >
      {{ t('map.pickHint') }}
    </v-chip>
  </v-card>
</template>
