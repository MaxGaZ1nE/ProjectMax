import type { Meta, StoryObj } from '@storybook/react-vite';
import { Metric } from './metric';

const meta: Meta<typeof Metric> = {
  title: 'Data Display/Metric',
  component: Metric,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Total Revenue',
    value: '$45,231',
  },
};

export const WithTrend: Story = {
  render: () => (
    <div className="flex gap-6">
      <Metric
        label="Revenue"
        value="$45,231"
        trend="up"
        trendValue="+12.5%"
      />
      <Metric
        label="Expenses"
        value="$12,430"
        trend="down"
        trendValue="-5.2%"
      />
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Metric
      label="Active Users"
      value="2,340"
      icon="👥"
      trend="up"
      trendValue="+8.1%"
    />
  ),
};

export const WithPrefix: Story = {
  args: {
    label: 'Total Sales',
    value: '1,234,567',
    prefix: '฿',
  },
};

export const WithSuffix: Story = {
  args: {
    label: 'Conversion Rate',
    value: '3.24',
    suffix: '%',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex gap-6 items-end">
      <Metric label="Small" value="123" size="sm" />
      <Metric label="Medium" value="456" size="md" />
      <Metric label="Large" value="789" size="lg" />
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="flex gap-6">
      <Metric label="Default" value="100" color="default" />
      <Metric label="Primary" value="200" color="primary" />
      <Metric label="Success" value="300" color="success" />
      <Metric label="Warning" value="400" color="warning" />
      <Metric label="Error" value="500" color="error" />
    </div>
  ),
};

export const Dashboard: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-4">
      <Metric
        label="Total Users"
        value="12,345"
        icon="👥"
        trend="up"
        trendValue="+12.5%"
      />
      <Metric
        label="Revenue"
        value="$89,432"
        icon="💰"
        trend="up"
        trendValue="+8.2%"
      />
      <Metric
        label="Orders"
        value="1,234"
        icon="📦"
        trend="down"
        trendValue="-2.1%"
      />
      <Metric
        label="Conversion"
        value="3.24%"
        icon="📈"
        trend="neutral"
        trendValue="0%"
      />
    </div>
  ),
};

export const Large: Story = {
  render: () => (
    <Metric
      label="Total Sales"
      value="$1,234,567"
      size="lg"
      trend="up"
      trendValue="+15.3%"
    />
  ),
};

export const Loading: Story = {
  args: {
    label: 'Loading Data',
    value: '',
    loading: true,
  },
};

export const InCard: Story = {
  render: () => (
    <div className="p-6 border rounded-lg bg-white dark:bg-neutral-800 shadow-sm">
      <Metric
        label="Monthly Recurring Revenue"
        value="$84,232"
        trend="up"
        trendValue="+12.3%"
        icon="📊"
      />
    </div>
  ),
};
