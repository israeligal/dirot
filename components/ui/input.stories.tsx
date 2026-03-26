import type { Meta, StoryObj } from "@storybook/react"
import { Input } from "./input"

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[320px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { placeholder: "הזן כתובת..." },
}

export const WithValue: Story = {
  args: { defaultValue: "רחוב הרצל 15, תל אביב" },
}

export const Disabled: Story = {
  args: { placeholder: "לא פעיל", disabled: true },
}

export const Invalid: Story = {
  args: { placeholder: "שדה שגוי", "aria-invalid": true },
}

export const Password: Story = {
  args: { type: "password", placeholder: "סיסמה" },
}

export const Email: Story = {
  args: { type: "email", placeholder: "example@email.com" },
}
