import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import Workshops from './workshops.vue'

const meta = {
  title: 'Pages/Workshops',
  component: Workshops,
  beforeEach: () => {
    localStorage.removeItem('user-location')
  },
} satisfies Meta<typeof Workshops>

export default meta
type Story = StoryObj<typeof meta>

const names = (root: HTMLElement) => within(root).queryAllByTestId('finder-item').map(el => el.querySelector('.v-card-title')?.textContent?.trim())
const markers = (root: HTMLElement) => within(root).getByTestId('workshop-map').querySelectorAll('.leaflet-marker-icon')

async function choose(root: HTMLElement, testId: string, text: string, option: RegExp) {
  const input = within(root).getByTestId(testId).querySelector('input')!
  await userEvent.click(input)
  await userEvent.type(input, text)
  await userEvent.click(await screen.findByRole('option', { name: option }), { pointerEventsCheck: 0 })
}

/** Without a location every approved workshop is listed and pinned on the map. */
export const MapAndList: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(names(canvasElement)).toHaveLength(2))
    await expect(names(canvasElement)).not.toContain('Garage Nowy')
    await waitFor(() => expect(markers(canvasElement)).toHaveLength(2))
    await expect(within(canvasElement).getByTestId('finder-sort').querySelector('[value="distance"]')).toBeDisabled()
  },
}

/** Choosing a city measures distance and keeps workshops within 50 km. */
export const ChooseCity: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(names(canvasElement)).toHaveLength(2))
    await choose(canvasElement, 'finder-city', 'Krak', /^Kraków$/)
    await waitFor(() => expect(names(canvasElement)).toEqual(['AutoFix Kraków']))
    await expect(within(canvasElement).getByTestId('finder-distance')).toHaveTextContent(/km|m/)
    await expect(JSON.parse(localStorage.getItem('user-location')!)).toMatchObject({ source: 'city', city: 'krakow' })
  },
}

/** "My location" asks the browser; the nearest workshop goes first. */
export const UseMyLocation: Story = {
  play: async ({ canvasElement }) => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition: (ok: PositionCallback) => ok({ coords: { latitude: 52.23, longitude: 21.0 } } as GeolocationPosition) },
    })
    await waitFor(() => expect(names(canvasElement)).toHaveLength(2))
    await userEvent.click(within(canvasElement).getByTestId('finder-gps'))
    await waitFor(() => expect(names(canvasElement)).toEqual(['Bavaria Service']))
    await expect(within(canvasElement).getByTestId('finder-distance')).toHaveTextContent('~')
    await userEvent.click(within(canvasElement).getByTestId('finder-radius').querySelector('.v-field')!)
    await userEvent.click(await screen.findByRole('option', { name: 'Cała Polska' }), { pointerEventsCheck: 0 })
    await waitFor(() => expect(names(canvasElement)).toEqual(['Bavaria Service', 'AutoFix Kraków']))
  },
}

/** A workshop that lists brands is hidden for other brands; empty list = all brands. */
export const BrandFilter: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(names(canvasElement)).toHaveLength(2))
    await choose(canvasElement, 'public-brand-filter', 'Toyo', /^Toyota$/)
    await waitFor(() => expect(names(canvasElement)).toEqual(['AutoFix Kraków']))
    await expect(within(canvasElement).getByTestId('workshop-brands')).toHaveTextContent('Wszystkie marki')
  },
}
