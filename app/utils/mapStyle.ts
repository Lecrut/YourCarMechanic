import type { StyleSpecification } from 'maplibre-gl'

/**
 * Light and dark map themes built from ONE base style (OpenFreeMap "positron"), so both share the
 * same layout and only differ in colours, plus labels in the app language.
 * Layer ids follow the OpenMapTiles schema; unknown layers keep the base colours.
 */
export type MapTheme = 'light' | 'dark'

type Paint = Record<string, unknown>
type Layer = StyleSpecification['layers'][number]

/** Surfaces and roads per layer id. */
const PALETTE: Record<MapTheme, Record<string, Paint>> = {
  light: {
    background: { 'background-color': '#f4f5f2' },
    water: { 'fill-color': '#cddff0' },
    waterway: { 'line-color': '#b7d0e6' },
    park: { 'fill-color': '#e2ecdc' },
    landcover_wood: { 'fill-color': '#d8e5d1' },
    landuse_residential: { 'fill-color': '#eceee9' },
    building: { 'fill-color': '#e6e7e2', 'fill-outline-color': '#d6d7d2' },
  },
  dark: {
    'background': { 'background-color': '#16181b' },
    'park': { 'fill-color': '#1a231e' },
    'landcover_wood': { 'fill-color': '#19221c' },
    'landcover_ice_shelf': { 'fill-color': '#1f2226' },
    'landcover_glacier': { 'fill-color': '#1f2226' },
    'water': { 'fill-color': '#182633' },
    'waterway': { 'line-color': '#1f3447' },
    'landuse_residential': { 'fill-color': '#1a1c1f' },
    'building': { 'fill-color': '#212429', 'fill-outline-color': '#2a2e34' },
    'tunnel_motorway_casing': { 'line-color': '#24282d' },
    'tunnel_motorway_inner': { 'line-color': '#2e3339' },
    'aeroway-taxiway': { 'line-color': '#2a2e33' },
    'aeroway-runway-casing': { 'line-color': '#2a2e33' },
    'aeroway-area': { 'fill-color': '#202327' },
    'aeroway-runway': { 'line-color': '#30353b' },
    'road_area_pier': { 'fill-color': '#16181b' },
    'road_pier': { 'line-color': '#16181b' },
    'highway_path': { 'line-color': '#25292e' },
    'highway_minor': { 'line-color': '#2b2f35' },
    'highway_major_casing': { 'line-color': '#1f2226' },
    'highway_major_inner': { 'line-color': '#3a4048' },
    'highway_major_subtle': { 'line-color': '#30353c' },
    'highway_motorway_casing': { 'line-color': '#1f2226' },
    'highway_motorway_inner': { 'line-color': '#4b535d' },
    'highway_motorway_subtle': { 'line-color': '#3a4048' },
    'highway_motorway_bridge_casing': { 'line-color': '#1f2226' },
    'highway_motorway_bridge_inner': { 'line-color': '#4b535d' },
    'railway_transit': { 'line-color': '#2c3035' },
    'railway_service': { 'line-color': '#2c3035' },
    'railway': { 'line-color': '#2c3035' },
    'railway_transit_dashline': { 'line-color': '#16181b' },
    'railway_service_dashline': { 'line-color': '#16181b' },
    'railway_dashline': { 'line-color': '#16181b' },
    'boundary_3': { 'line-color': '#66707a' },
    'boundary_2': { 'line-color': '#66707a' },
    'boundary_disputed': { 'line-color': '#66707a' },
  },
}

/** Label colours: places, roads and water, each with a halo in the background colour. */
const LABELS: Record<MapTheme, { place: string, minor: string, road: string, water: string, halo: string }> = {
  light: { place: '#2f3337', minor: '#5f656b', road: '#6b7177', water: '#3f6890', halo: '#f4f5f2' },
  dark: { place: '#e4e7ea', minor: '#a9b0b7', road: '#8a9199', water: '#7ea7cf', halo: '#16181b' },
}

/** Text expression: the name in the app language, then the local name (with Polish diacritics). */
export function labelExpression(lang: string): unknown[] {
  return lang === 'pl'
    ? ['coalesce', ['get', 'name:pl'], ['get', 'name']]
    : ['coalesce', ['get', 'name:en'], ['get', 'name_en'], ['get', 'name:latin'], ['get', 'name']]
}

/** Only labels that show a name – road-number shields (`ref`) stay as they are. */
const showsName = (field: unknown) => JSON.stringify(field ?? '').includes('"name')

function labelKind(id: string): keyof typeof LABELS['light'] {
  if (id.startsWith('water')) return 'water'
  if (id.startsWith('highway-name')) return 'road'
  if (/city|town|country|state/.test(id)) return 'place'
  return 'minor'
}

/** Returns a new style (the base is not mutated) for the theme and UI language. */
export function themedMapStyle(base: StyleSpecification, theme: MapTheme, lang: string): StyleSpecification {
  const style = structuredClone(base)
  const colors = LABELS[theme]
  style.layers = style.layers.map((layer): Layer => {
    const paint = { ...((layer as { paint?: Paint }).paint ?? {}), ...PALETTE[theme][layer.id] }
    if (layer.type !== 'symbol') return { ...layer, paint } as Layer
    const layout = { ...(layer.layout ?? {}) } as Paint
    if (!showsName(layout['text-field'])) return { ...layer, paint } as Layer
    layout['text-field'] = labelExpression(lang)
    paint['text-color'] = colors[labelKind(layer.id)]
    paint['text-halo-color'] = colors.halo
    return { ...layer, layout, paint } as Layer
  })
  return style
}
