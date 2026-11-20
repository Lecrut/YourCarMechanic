import { describe, expect, it } from 'vitest'
import type { StyleSpecification } from 'maplibre-gl'
import { labelExpression, themedMapStyle } from '~/utils/mapStyle'

const base = {
  version: 8,
  sources: {},
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': 'rgb(242,243,240)' } },
    { id: 'water', type: 'fill', source: 'openmaptiles', paint: { 'fill-color': 'grey' } },
    { id: 'label_city', type: 'symbol', source: 'openmaptiles', layout: { 'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name']] }, paint: { 'text-color': '#000' } },
    { id: 'highway-shield-non-us', type: 'symbol', source: 'openmaptiles', layout: { 'text-field': ['to-string', ['get', 'ref']] } },
    { id: 'custom', type: 'fill', source: 'openmaptiles', paint: { 'fill-color': 'pink' } },
  ],
} as unknown as StyleSpecification

const layer = (s: StyleSpecification, id: string) => s.layers.find(l => l.id === id) as unknown as { paint: Record<string, unknown>, layout?: Record<string, unknown> }

describe('map style', () => {
  it('dark and light recolour the same layers, unknown ones keep the base colour', () => {
    const dark = themedMapStyle(base, 'dark', 'pl')
    const light = themedMapStyle(base, 'light', 'pl')
    expect(layer(dark, 'background').paint['background-color']).toBe('#16181b')
    expect(layer(light, 'background').paint['background-color']).toBe('#f4f5f2')
    expect(layer(dark, 'water').paint['fill-color']).not.toBe(layer(light, 'water').paint['fill-color'])
    expect(layer(dark, 'custom').paint['fill-color']).toBe('pink')
    expect(dark.layers.map(l => l.id)).toEqual(light.layers.map(l => l.id))
  })

  it('labels in the app language with readable colours; road shields untouched', () => {
    const dark = themedMapStyle(base, 'dark', 'pl')
    expect(layer(dark, 'label_city').layout!['text-field']).toEqual(['coalesce', ['get', 'name:pl'], ['get', 'name']])
    expect(layer(dark, 'label_city').paint['text-color']).toBe('#e4e7ea')
    expect(layer(dark, 'label_city').paint['text-halo-color']).toBe('#16181b')
    expect(layer(dark, 'highway-shield-non-us').layout!['text-field']).toEqual(['to-string', ['get', 'ref']])
    expect(layer(themedMapStyle(base, 'light', 'en'), 'label_city').layout!['text-field']).toEqual(labelExpression('en'))
  })

  it('does not mutate the base style', () => {
    themedMapStyle(base, 'dark', 'pl')
    expect(layer(base, 'background').paint['background-color']).toBe('rgb(242,243,240)')
  })
})
