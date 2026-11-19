import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import { ref } from 'vue'
import PageHeader from './pageHeader.vue'
import MySnackbar from './mySnackbar.vue'
import AuthCard from './authCard.vue'
import WorkshopForm from './workshopForm.vue'
import { mapIWorkshop } from '~/models/workshop'
import { autofix } from '../../.storybook/mocks/fixtures'

const meta = {
  title: 'Common/Building blocks',
  component: PageHeader,
} satisfies Meta<typeof PageHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Header: Story = {
  args: { title: 'Lista napraw', subtitle: 'AutoFix Kraków', icon: 'mdi-car-wrench' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Lista napraw' })).toBeVisible()
    await expect(canvas.getByText('AutoFix Kraków')).toBeVisible()
  },
}

export const Snackbar: Story = {
  args: { title: '', icon: '' },
  render: () => ({
    components: { MySnackbar },
    setup: () => ({ shown: ref(true) }),
    template: `<my-snackbar v-model="shown" text="Zapisano" :is-error="false" />`,
  }),
  play: async () => {
    await expect(await screen.findByText('Zapisano')).toBeVisible()
  },
}

export const AuthLayout: Story = {
  args: { title: '', icon: '' },
  render: () => ({
    components: { AuthCard },
    template: `<auth-card title="Logowanie" image="/login.jpg"><p>Formularz</p></auth-card>`,
  }),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('heading', { name: 'Logowanie' })).toBeVisible()
  },
}

/** Shared company form: validation of required fields and opening hours. */
export const CompanyFormValidation: Story = {
  args: { title: '', icon: '' },
  render: () => ({
    components: { WorkshopForm },
    setup() {
      const workshop = ref(mapIWorkshop({ openingTime: 16, closingTime: 8 }))
      const form = ref<InstanceType<typeof WorkshopForm> | null>(null)
      const result = ref<string>('')
      const validate = async () => (result.value = String(await form.value?.isValid()))
      return { workshop, form, result, validate }
    },
    template: `
      <div>
        <workshop-form ref="form" v-model="workshop" nip-editable />
        <v-btn data-testid="validate" @click="validate">validate</v-btn>
        <span data-testid="result">{{ result }}</span>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByTestId('validate'))
    await waitFor(() => expect(canvas.getByTestId('result')).toHaveTextContent('false'))
    await expect(canvas.getAllByText('Zamknięcie musi być po otwarciu').length).toBeGreaterThan(0)
    await expect(canvas.getAllByText('Pole jest wymagane').length).toBeGreaterThan(0)
  },
}

export const CompanyFormReadonly: Story = {
  args: { title: '', icon: '' },
  render: () => ({
    components: { WorkshopForm },
    setup: () => ({ workshop: ref(mapIWorkshop(autofix)) }),
    template: `<workshop-form v-model="workshop" readonly email="serwis@example.com" />`,
  }),
  play: async ({ canvasElement }) => {
    const name = within(canvasElement).getByTestId('company-name').querySelector('input')!
    await expect(name).toHaveValue('AutoFix Kraków')
    await expect(name).toHaveAttribute('readonly')
  },
}
