// Minimal stand-ins for Nuxt composables used by app code rendered in Storybook / Vitest.
import { i18n } from './i18n'

export const navigatedTo: string[] = []

export async function navigateTo(path: string) {
  navigatedTo.push(path)
}

// No map style in Storybook/tests – the map renders markers on a plain background, no network.
export const useRuntimeConfig = () => ({ public: { firebase: {}, useEmulators: false, map: { style: '' } } })

export const definePageMeta = (_meta: unknown) => {}

export const defineNuxtRouteMiddleware = <T>(fn: T) => fn

export const defineNuxtPlugin = <T>(plugin: T) => plugin

export const useHead = (_input: unknown) => {}

/** Only `$i18n` is used (stores translate outside components, e.g. during a middleware). */
export const useNuxtApp = () => ({ $i18n: i18n.global })
