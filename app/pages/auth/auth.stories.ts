import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import Login from './login.vue'
import Register from './register.vue'
import RoleChoice from './role-choice.vue'
import { authService, workshopsService } from '~/services'
import { navigatedTo } from '../../../.storybook/mocks/nuxt'
import { newUser } from '../../../.storybook/mocks/fixtures'

const meta = {
  title: 'Pages/Auth',
  component: Login,
} satisfies Meta<typeof Login>

export default meta
type Story = StoryObj<typeof meta>

const type = async (root: HTMLElement, testId: string, value: string) =>
  userEvent.type(within(root).getByTestId(testId).querySelector('input')!, value)

export const LoginSuccess: Story = {
  play: async ({ canvasElement }) => {
    await type(canvasElement, 'email', 'anna@example.com')
    await type(canvasElement, 'password', 'whatever-password')
    await userEvent.click(within(canvasElement).getByTestId('submit'))
    await waitFor(() => expect(authService.logIn).toHaveBeenCalledWith('anna@example.com', 'whatever-password'))
    await waitFor(() => expect(navigatedTo).toContain('/user'))
  },
}

export const LoginWrongCredentials: Story = {
  play: async ({ canvasElement }) => {
    await type(canvasElement, 'email', 'nobody@example.com')
    await type(canvasElement, 'password', 'secret-password')
    await userEvent.click(within(canvasElement).getByTestId('submit'))
    await expect(await within(document.body).findByText('Niepoprawne dane logowania')).toBeVisible()
    await expect(navigatedTo).toHaveLength(0)
  },
}

export const LoginValidation: Story = {
  play: async ({ canvasElement }) => {
    await type(canvasElement, 'email', 'not-an-email')
    await userEvent.click(within(canvasElement).getByTestId('submit'))
    await expect(await within(canvasElement).findByText('Niepoprawny format email')).toBeInTheDocument()
    await expect(authService.logIn).not.toHaveBeenCalled()
  },
}

export const RegisterPasswordsMustMatch: Story = {
  render: () => ({ components: { Register }, template: '<register />' }),
  play: async ({ canvasElement }) => {
    await type(canvasElement, 'email', 'new@example.com')
    await type(canvasElement, 'password', 'long-enough-password')
    await type(canvasElement, 'password-repeat', 'different-password!')
    await userEvent.click(within(canvasElement).getByTestId('submit'))
    await expect((await within(canvasElement).findAllByText('Hasła muszą być identyczne'))[0]).toBeInTheDocument()
    await expect(authService.signUp).not.toHaveBeenCalled()
  },
}

export const RegisterSuccess: Story = {
  render: () => ({ components: { Register }, template: '<register />' }),
  play: async ({ canvasElement }) => {
    await type(canvasElement, 'email', 'new@example.com')
    await type(canvasElement, 'password', 'long-enough-password')
    await type(canvasElement, 'password-repeat', 'long-enough-password')
    await userEvent.click(within(canvasElement).getByTestId('terms').querySelector('input')!)
    await userEvent.click(within(canvasElement).getByTestId('submit'))
    await waitFor(() => expect(authService.signUp).toHaveBeenCalled())
    await waitFor(() => expect(navigatedTo).toContain('/auth/role-choice'))
  },
}

/** A new account picks "user", fills the profile and lands on the booking page. */
export const ChooseUserRole: Story = {
  parameters: { app: { user: newUser } },
  render: () => ({ components: { RoleChoice }, template: '<role-choice />' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByTestId('role-user'))
    await userEvent.click(canvas.getByTestId('choose-role'))
    const inputs = canvasElement.querySelectorAll('.v-window-item--active input')
    await userEvent.type(inputs[0]!, 'Jan')
    await userEvent.type(inputs[1]!, 'Nowak')
    await userEvent.type(inputs[2]!, '600700800')
    await userEvent.click(canvas.getByTestId('save-details'))
    await waitFor(() => expect(authService.updateProfile).toHaveBeenCalled())
    await waitFor(() => expect(navigatedTo).toContain('/user'))
  },
}

/** A workshop has to fill the company form – nothing is saved while it is invalid. */
export const ChooseWorkshopRoleValidation: Story = {
  parameters: { app: { user: newUser } },
  render: () => ({ components: { RoleChoice }, template: '<role-choice />' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByTestId('role-workshop'))
    await userEvent.click(canvas.getByTestId('choose-role'))
    await userEvent.click(canvas.getByTestId('save-details'))
    await expect((await canvas.findAllByText('Pole jest wymagane')).length).toBeGreaterThan(0)
    await expect(workshopsService.addWorkshop).not.toHaveBeenCalled()
  },
}
