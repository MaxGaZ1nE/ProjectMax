import type { Meta, StoryObj } from '@storybook/react-vite';
import { Statistic } from './statistic';

const meta: Meta<typeof Statistic> = {
  title: 'Data Display/Statistic',
  component: Statistic,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Total Users',
    value: 12345,
  },
};

export const WithPrefix: Story = {
  args: {
    label: 'Revenue',
    value: 45231,
    prefix: '฿',
  },
};

export const WithSuffix: Story = {
  args: {
    label: 'Success Rate',
    value: 98.5,
    suffix: '%',
  },
};

export const WithTrend: Story = {
  render: () => (
    <div className="flex gap-8">
      <Statistic
        label="Sales"
        value={12345}
        prefix="฿"
        trend={{ value: 12.5, direction: 'up' }}
      />
      <Statistic
        label="Returns"
        value={234}
        trend={{ value: 8.2, direction: 'down' }}
      />
    </div>
  ),
};

export const WithHelpText: Story = {
  args: {
    label: 'Total Revenue',
    value: '$45,231',
    helpText: 'Compared to last month',
  },
};

export const Loading: Story = {
  args: {
    label: 'Processing',
    value: 0,
    loading: true,
  },
};

export const Dashboard: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-6">
      <div className="p-4 border rounded-lg">
        <Statistic
          label="Total Users"
          value={23456}
          trend={{ value: 12, direction: 'up' }}
        />
      </div>
      <div className="p-4 border rounded-lg">
        <Statistic
          label="Revenue"
          value={89432}
          prefix="฿"
          trend={{ value: 8, direction: 'up' }}
        />
      </div>
      <div className="p-4 border rounded-lg">
        <Statistic
          label="Bounce Rate"
          value={32.5}
          suffix="%"
          trend={{ value: 5, direction: 'down' }}
        />
      </div>
      <div className="p-4 border rounded-lg">
        <Statistic
          label="Avg Session"
          value={4.2}
          suffix=" min"
          trend={{ value: 15, direction: 'up' }}
        />
      </div>
    </div>
  ),
};

export const Compact: Story = {
  render: () => (
    <div className="flex gap-8">
      <Statistic label="Views" value={1234} />
      <Statistic label="Likes" value={567} />
      <Statistic label="Comments" value={89} />
    </div>
  ),
};

export const WithPrefixIcon: Story = {
  render: () => (
    <div className="flex gap-8">
      <Statistic label="Revenue" value="45,231" prefix={<span>💰</span>} />
      <Statistic label="Users" value="2,340" prefix={<span>👥</span>} />
      <Statistic label="Orders" value="1,234" prefix={<span>📦</span>} />
    </div>
  ),
};
