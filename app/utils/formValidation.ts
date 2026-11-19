import type { VForm } from 'vuetify/components'

/** What a form component exposes to its parent (e.g. WorkshopForm). */
export interface ValidatableForm {
  isValid: () => Promise<boolean>
}

/** `ref="form"` + `v-model="valid"` helpers for a single <v-form>. */
export default function formValidation() {
  const form = ref<InstanceType<typeof VForm> | null>(null)
  const valid = ref<boolean | null>(false)

  async function isValid(): Promise<boolean> {
    const result = (await form.value?.validate())?.valid ?? false
    valid.value = result
    return result
  }

  return { form, valid, isValid }
}
