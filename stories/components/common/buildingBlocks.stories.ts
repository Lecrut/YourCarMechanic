import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, screen, userEvent, waitFor, within } from 'storybook/test'
import { ref } from 'vue'
import PageHeader from '~/components/common/pageHeader.vue'
import MySnackbar from '~/components/common/mySnackbar.vue'
import ServiceList from '~/components/common/serviceList.vue'
import AuthCard from '~/components/account/authCard.vue'
import WorkshopForm from '~/components/workshop/workshopForm.vue'
import { mapIWorkshop } from '~/mappers/workshop'
import { autofix } from '../../../.storybook/mocks/fixtures'

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
    template: `<auth-card title="Logowanie" image="/login.webp"><p>Formularz</p></auth-card>`,
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

/** Working days are part of the company form; at least one is required. */
export const CompanyWorkingDays: Story = {
  args: { title: '', icon: '' },
  render: () => ({
    components: { WorkshopForm },
    setup() {
      const workshop = ref(mapIWorkshop({ ...autofix, workingDays: [1] }))
      const form = ref<InstanceType<typeof WorkshopForm> | null>(null)
      const result = ref('')
      const validate = async () => (result.value = String(await form.value?.isValid()))
      return { workshop, form, result, validate }
    },
    template: `
      <div>
        <workshop-form ref="form" v-model="workshop" />
        <v-btn data-testid="validate" @click="validate">validate</v-btn>
        <span data-testid="result">{{ result }}</span>
        <span data-testid="days">{{ workshop.workingDays.join(',') }}</span>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const chips = [...canvas.getByTestId('company-working-days').querySelectorAll<HTMLElement>('.v-chip')]
    await expect(chips).toHaveLength(7)
    // Monday is the only selected day – unselecting it leaves none.
    await userEvent.click(chips[0]!)
    await expect(canvas.getByTestId('days')).toHaveTextContent('')
    await expect(canvas.getByText('Wybierz co najmniej jedną opcję')).toBeVisible()
    await userEvent.click(canvas.getByTestId('validate'))
    await waitFor(() => expect(canvas.getByTestId('result')).toHaveTextContent('false'))
  },
}

/** Brands (empty = all) and the map pin are part of the company profile. */
export const CompanyBrandsAndPin: Story = {
  args: { title: '', icon: '' },
  render: () => ({
    components: { WorkshopForm },
    setup: () => ({ workshop: ref(mapIWorkshop(autofix)) }),
    template: `
      <div>
        <workshop-form v-model="workshop" />
        <span data-testid="brands">{{ workshop.brands.join(',') }}</span>
        <span data-testid="pin">{{ workshop.location ? 'set' : 'none' }}</span>
      </div>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const brands = canvas.getByTestId('company-brands').querySelector('input')!
    await expect(brands).toHaveAttribute('placeholder', 'Wszystkie marki')
    await userEvent.click(brands)
    await userEvent.type(brands, 'Toyo')
    await userEvent.click(await screen.findByRole('option', { name: 'Toyota' }), { pointerEventsCheck: 0 })
    await expect(canvas.getByTestId('brands')).toHaveTextContent('Toyota')

    await expect(canvas.getByTestId('company-location-state')).toHaveTextContent('Pinezka ustawiona')
    await userEvent.click(canvas.getByTestId('company-location-clear'))
    await expect(canvas.getByTestId('pin')).toHaveTextContent('none')
    await expect(canvas.getByTestId('company-location-state')).toHaveTextContent('Nie ustawiono')
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

/** Table cells list the first 3 services, the rest is collapsed into "+N". */
export const ServicesInTable: Story = {
  args: { title: '', icon: '' },
  render: () => ({
    components: { ServiceList },
    template: `<service-list :services="['oil', 'tires', 'engine', 'electrician', 'engineFlush']" />`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(/Wymiana oleju silnikowego i filtra/)).toBeVisible()
    await expect(canvas.queryByText(/Płukanka silnika/)).toBeNull()
    await expect(canvas.getByTestId('services-more')).toHaveTextContent('+2')
  },
}
