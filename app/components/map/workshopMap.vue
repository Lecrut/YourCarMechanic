<script setup lang="ts">
import type { GeoJSONSource, GeoJSONSourceSpecification, Map as MapLibreMap, Marker, StyleSpecification } from 'maplibre-gl'
import { useTheme } from 'vuetify'
import { type LatLng, POLAND_CENTER } from '~/models/geo'
import { themedMapStyle } from '~/utils/mapStyle'

type GeoJSONSourceData = Exclude<GeoJSONSourceSpecification['data'], string>

export interface MapMarker {
  id: string
  position: LatLng
  label: string
  /** Shown as a small badge on the marker, e.g. "4.8". */
  badge?: string
  approximate?: boolean
}

/**
 * Vector map (MapLibre + OpenFreeMap styles, free incl. commercial use) with Vuetify-styled
 * markers and controls, the user's position with the search radius and theme-aware styles.
 * MapLibre is loaded on demand. `pickable` turns it into a location picker (click / drag a pin).
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

const { t, locale } = useI18n()
const theme = useTheme()
const config = useRuntimeConfig().public.map as { style: string }

const container = ref<HTMLElement | null>(null)
const ready = ref(false)
/** WebGL unavailable or the library failed to load – the list next to the map still works. */
const failed = ref(false)

type MapLibre = typeof import('maplibre-gl')
let ml: MapLibre | null = null
let map: MapLibreMap | null = null
let markerObjects: Marker[] = []
let originMarker: Marker | null = null
let pickMarker: Marker | null = null

const RADIUS_SOURCE = 'search-radius'

/** No style URL (Storybook/tests) = plain background, no network. */
const EMPTY_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#e8eaed' } }],
}

/** The base style is downloaded once per page load and themed locally (dark/light, label language). */
let baseStyle: Promise<StyleSpecification> | null = null
function loadBaseStyle() {
  baseStyle ??= fetch(config.style).then((r) => {
    if (!r.ok) throw new Error(`Map style ${r.status}`)
    return r.json() as Promise<StyleSpecification>
  })
  return baseStyle
}

async function currentStyle(): Promise<StyleSpecification> {
  if (!config.style) return EMPTY_STYLE
  return themedMapStyle(await loadBaseStyle(), theme.global.current.value.dark ? 'dark' : 'light', locale.value)
}

function themeColor(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(`--v-theme-${name}`).trim()
  return value ? `rgb(${value})` : fallback
}

type MarkerState = 'normal' | 'highlighted' | 'selected'
const markerSize = (state: MarkerState) => (state === 'selected' ? 48 : state === 'highlighted' ? 44 : 38)

/** Marker: Vuetify utility classes, theme surface as a ring, the name as a chip when active. */
function markerElement(m: MapMarker, state: MarkerState) {
  const size = markerSize(state)
  const color = state === 'normal' ? (m.approximate ? 'bg-blue-grey' : 'bg-primary') : 'bg-secondary'
  const el = document.createElement('div')
  el.className = 'd-flex flex-column align-center'
  el.style.cursor = 'pointer'
  el.dataset.testid = 'map-marker'
  el.title = m.label
  el.innerHTML = `
    <div class="position-relative d-flex align-center justify-center rounded-circle elevation-${state === 'normal' ? 3 : 5} ${color} text-white"
      style="width:${size}px;height:${size}px;border:3px solid rgb(var(--v-theme-surface));transition:all .15s">
      <i class="mdi mdi-garage" style="font-size:${size / 2}px"></i>
      ${m.badge ? `<span class="position-absolute bg-amber text-black rounded-pill elevation-2 px-1 text-label-small font-weight-bold" style="top:-6px;right:-12px;line-height:16px"><i class="mdi mdi-star"></i>${m.badge}</span>` : ''}
    </div>`
  if (state !== 'normal' && m.label) {
    const label = document.createElement('span')
    label.className = 'mt-1 px-2 rounded-pill bg-surface elevation-2 text-label-medium font-weight-bold text-no-wrap'
    label.textContent = m.label
    el.appendChild(label)
  }
  return el
}

function renderMarkers() {
  if (!ml || !map) return
  markerObjects.forEach(m => m.remove())
  markerObjects = props.markers.map((m) => {
    const state: MarkerState = m.id === props.selectedId ? 'selected' : m.id === props.highlightedId ? 'highlighted' : 'normal'
    const el = markerElement(m, state)
    el.addEventListener('click', (e) => {
      e.stopPropagation()
      emit('select', m.id)
    })
    // Workshops above the user's position dot; the active one above the rest.
    el.style.zIndex = state === 'normal' ? '1' : '2'
    // Anchor at the top, shifted up by half the circle – the circle's centre sits on the point.
    return new ml!.Marker({ element: el, anchor: 'top', offset: [0, -markerSize(state) / 2] })
      .setLngLat([m.position.lng, m.position.lat])
      .addTo(map!)
  })
}

/** Circle polygon (64 points) – good enough for a search radius. */
function circle(center: LatLng, km: number): [number, number][] {
  const coords: [number, number][] = []
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * 2 * Math.PI
    coords.push([
      center.lng + (km / (111.32 * Math.cos((center.lat * Math.PI) / 180))) * Math.cos(a),
      center.lat + (km / 110.57) * Math.sin(a),
    ])
  }
  return coords
}

function renderRadius() {
  if (!map || !map.isStyleLoaded()) return
  const data: GeoJSONSourceData = {
    type: 'FeatureCollection',
    features: props.origin && props.radiusKm
      ? [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [circle(props.origin, props.radiusKm)] } }]
      : [],
  }
  const source = map.getSource(RADIUS_SOURCE) as GeoJSONSource | undefined
  if (source) return source.setData(data)
  const color = themeColor('primary', '#0054db')
  map.addSource(RADIUS_SOURCE, { type: 'geojson', data })
  map.addLayer({ id: 'radius-fill', type: 'fill', source: RADIUS_SOURCE, paint: { 'fill-color': color, 'fill-opacity': 0.07 } })
  map.addLayer({ id: 'radius-line', type: 'line', source: RADIUS_SOURCE, paint: { 'line-color': color, 'line-opacity': 0.6, 'line-width': 1.5, 'line-dasharray': [3, 2] } })
}

function renderOrigin() {
  if (!ml || !map) return
  originMarker?.remove()
  originMarker = null
  renderRadius()
  if (!props.origin) return
  const el = document.createElement('div')
  el.className = 'rounded-circle elevation-4 bg-blue'
  el.dataset.testid = 'map-origin'
  el.style.cssText = 'width:18px;height:18px;border:3px solid white;box-shadow:0 0 0 8px rgba(33,150,243,.25);z-index:0'
  originMarker = new ml.Marker({ element: el }).setLngLat([props.origin.lng, props.origin.lat]).addTo(map)
}

function renderPick() {
  if (!ml || !map || !props.pickable) return
  if (!props.picked) {
    pickMarker?.remove()
    pickMarker = null
    return
  }
  if (!pickMarker) {
    const el = markerElement({ id: 'pick', position: props.picked, label: '' }, 'selected')
    pickMarker = new ml.Marker({ element: el, draggable: true }).setLngLat([props.picked.lng, props.picked.lat]).addTo(map)
    pickMarker.on('dragend', () => {
      const p = pickMarker!.getLngLat()
      emit('pick', { lat: p.lat, lng: p.lng })
    })
  }
  else pickMarker.setLngLat([props.picked.lng, props.picked.lat])
}

/** Shows everything relevant: the radius (or the markers and the user). */
function fitView() {
  if (!ml || !map) return
  if (props.pickable && props.picked) return map.jumpTo({ center: [props.picked.lng, props.picked.lat], zoom: 15 })
  const points: [number, number][] = props.origin && props.radiusKm
    ? circle(props.origin, props.radiusKm)
    : props.markers.map(m => [m.position.lng, m.position.lat])
  if (props.origin && !props.radiusKm) points.push([props.origin.lng, props.origin.lat])
  if (points.length > 1) {
    const bounds = points.reduce((b, p) => b.extend(p), new ml.LngLatBounds(points[0]!, points[0]!))
    return map.fitBounds(bounds, { padding: 56, maxZoom: 14, duration: 600 })
  }
  if (points.length === 1) return map.jumpTo({ center: points[0]!, zoom: 13 })
  map.jumpTo({ center: [POLAND_CENTER.lng, POLAND_CENTER.lat], zoom: 5.3 })
}

onMounted(async () => {
  try {
    const [lib, worker] = await Promise.all([
      import('maplibre-gl'),
      // Bundle the worker as an asset – MapLibre's own lookup next to the chunk does not survive bundling.
      import('maplibre-gl/dist/maplibre-gl-worker.mjs?url'),
      import('maplibre-gl/dist/maplibre-gl.css'),
    ])
    ml = lib
    ml.setWorkerUrl(worker.default)
    if (!container.value) return
    map = new ml.Map({
      container: container.value,
      style: await currentStyle(),
      center: [POLAND_CENTER.lng, POLAND_CENTER.lat],
      zoom: 5.3,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
    })
    map.touchZoomRotate.disableRotation()
    // Re-add the radius layers after every style (theme) switch.
    map.on('style.load', renderRadius)
    if (props.pickable) map.on('click', e => emit('pick', { lat: e.lngLat.lat, lng: e.lngLat.lng }))
    renderOrigin()
    renderMarkers()
    renderPick()
    fitView()
    map.once('load', () => (ready.value = true))
  }
  catch (e) {
    console.error(e)
    failed.value = true
    ready.value = true
  }
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
})

// Theme or language switch: restyle in place (markers stay, radius layers are re-added on style.load).
watch(() => [theme.global.current.value.dark, locale.value], async () => {
  if (!map || !config.style) return
  const style = await currentStyle()
  map?.setStyle(style, { diff: false })
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
  if (m && map) map.easeTo({ center: [m.position.lng, m.position.lat], duration: 500 })
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
      v-if="!failed"
      class="position-absolute d-flex flex-column ga-2 ma-3"
      style="top:0;right:0;z-index:2"
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
        icon="mdi-fit-to-screen-outline"
        size="small"
        color="surface"
        elevation="3"
        :aria-label="t('map.fit')"
        data-testid="map-fit"
        @click="fitView"
      />
    </div>

    <v-empty-state
      v-if="failed"
      class="position-absolute w-100 h-100 bg-surface-light"
      style="top:0;left:0;z-index:3"
      icon="mdi-map-marker-off-outline"
      :title="t('map.unavailable')"
      :text="t('map.unavailableText')"
    />

    <v-fade-transition>
      <div
        v-if="!ready"
        class="position-absolute d-flex align-center justify-center w-100 h-100 bg-surface-light"
        style="top:0;left:0;z-index:3"
      >
        <v-progress-circular
          indeterminate
          color="primary"
        />
      </div>
    </v-fade-transition>

    <v-chip
      v-if="pickable && !failed"
      class="position-absolute ma-3"
      style="bottom:0;left:50%;transform:translateX(-50%);z-index:2"
      color="surface"
      variant="flat"
      elevation="3"
      prepend-icon="mdi-gesture-tap"
    >
      {{ t('map.pickHint') }}
    </v-chip>
  </v-card>
</template>
