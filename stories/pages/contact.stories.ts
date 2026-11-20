import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, mocked, userEvent, waitFor, within } from 'storybook/test'
import Contact from '~/pages/contact.vue'
import { userAnna } from '../../.storybook/mocks/fixtures'
import { contactService } from '~/services'

const meta = {
  title: 'Pages/Contact',
  component: Contact,
} satisfies Meta<typeof Contact>

export default meta
type Story = StoryObj<typeof meta>

const field = (root: HTMLElement, id: string) =>
  within(root).getByTestId(id).querySelector('input, textarea') as HTMLInputElement

/** Guests can write to the moderators. */
export const GuestSendsMessage: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.type(field(canvasElement, 'contact-name'), 'Jan Kowalski')
    await userEvent.type(field(canvasElement, 'contact-email'), 'jan@example.com')
    await userEvent.type(field(canvasElement, 'contact-message'), 'Jak dodać drugi samochód do konta?')
    await userEvent.click(within(canvasElement).getByTestId('contact-submit'))
    await waitFor(() => expect(contactService.sendContactMessage).toHaveBeenCalled())
    const [input] = mocked(contactService.sendContactMessage).mock.calls.at(-1)!
    await expect(input).toMatchObject({ name: 'Jan Kowalski', email: 'jan@example.com', category: 'general', userRef: '' })
    await expect(await within(canvasElement).findByTestId('contact-sent')).toHaveTextContent('jan@example.com')
  },
}

export const Validation: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.type(field(canvasElement, 'contact-message'), 'za krótko')
    await userEvent.click(within(canvasElement).getByTestId('contact-submit'))
    await expect(await within(canvasElement).findByText('Napisz co najmniej 10 znaków')).toBeInTheDocument()
    await expect(contactService.sendContactMessage).not.toHaveBeenCalled()
  },
}

/** Signed-in users get their name and e-mail pre-filled; the message is linked to the account. */
export const SignedInUser: Story = {
  parameters: { app: { user: userAnna } },
  play: async ({ canvasElement }) => {
    await expect(field(canvasElement, 'contact-name')).toHaveValue('Anna Kowalska')
    await expect(field(canvasElement, 'contact-email')).toHaveValue('anna@example.com')
    await userEvent.type(field(canvasElement, 'contact-message'), 'Wizyta nie pojawia się w kalendarzu.')
    await userEvent.click(within(canvasElement).getByTestId('contact-submit'))
    await waitFor(() => expect(contactService.sendContactMessage).toHaveBeenCalled())
    const [input] = mocked(contactService.sendContactMessage).mock.calls.at(-1)!
    await expect(input.userRef).toBe('users/anna')
  },
}
