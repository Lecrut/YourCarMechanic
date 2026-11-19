// Minimal stand-ins for Nuxt composables used by app code rendered in Storybook / Vitest.

export const navigatedTo: string[] = []

export async function navigateTo(path: string) {
  navigatedTo.push(path)
}

export const useRuntimeConfig = () => ({ public: { firebase: {}, useEmulators: false } })

export const definePageMeta = (_meta: unknown) => {}

export const defineNuxtRouteMiddleware = <T>(fn: T) => fn

export const defineNuxtPlugin = <T>(plugin: T) => plugin
