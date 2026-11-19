// Single entry point for all Firebase access.
// Storybook aliases this module to .storybook/mocks/services.ts – keep both in sync.
export * as authService from './authService'
export * as carsService from './carsService'
export * as fixesService from './fixesService'
export * as workshopsService from './workshopsService'
export * as servicesCatalogService from './servicesCatalogService'
export * as moderatorService from './moderatorService'
export * as pricingService from './pricingService'
export * as reviewsService from './reviewsService'
export { initFirebase } from './firebase'
