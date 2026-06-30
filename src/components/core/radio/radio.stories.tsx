import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Radio } from './radio';

const meta: Meta<typeof Radio> = {
  title: 'Form/Radio',
  component: Radio,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Option A',
    name: 'option',
    value: 'a',
  },
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('a');
    return (
      <div className="space-y-2">
        <Radio
          label="Option A"
          name="controlled"
          value="a"
          checked={value === 'a'}
          onChange={() => setValue('a')}
        />
        <Radio
          label="Option B"
          name="controlled"
          value="b"
          checked={value === 'b'}
          onChange={() => setValue('b')}
        />
        <Radio
          label="Option C"
          name="controlled"
          value="c"
          checked={value === 'c'}
          onChange={() => setValue('c')}
        />
      </div>
    );
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Radio size="sm" label="Small radio" name="sizes" value="sm" />
      <Radio size="md" label="Medium radio" name="sizes" value="md" />
      <Radio size="lg" label="Large radio" name="sizes" value="lg" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="space-y-4">
      <Radio label="Unchecked" name="states1" value="unchecked" />
      <Radio label="Checked" name="states2" value="checked" defaultChecked />
      <Radio label="Disabled" name="states3" value="disabled" disabled />
      <Radio label="Disabled checked" name="states4" value="disabled-checked" disabled defaultChecked />
    </div>
  ),
};

export const WithDescription: Story = {
  args: {
    label: 'Standard shipping',
    description: 'Delivery in 5-7 business days',
    name: 'in_delivery',
    value: 'standard',
  },
};
