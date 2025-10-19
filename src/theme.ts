import { createTheme, type MantineColorsTuple } from '@mantine/core';

/**
 * ChurchTools-inspired color palette
 * Adjust these colors to match your ChurchTools instance's branding
 */
const ctBlue: MantineColorsTuple = [
  '#e7f5ff',
  '#d0ebff',
  '#a5d8ff',
  '#74c0fc',
  '#4dabf7',
  '#339af0', // Primary ChurchTools blue
  '#228be6',
  '#1c7ed6',
  '#1971c2',
  '#1864ab',
];

/**
 * Mantine theme configuration
 * Customized to match ChurchTools UI/UX patterns
 */
export const theme = createTheme({
  /** Primary color - ChurchTools blue */
  primaryColor: 'ct-blue',
  
  /** Custom color palette */
  colors: {
    'ct-blue': ctBlue,
  },
  
  /** Default radius for components */
  defaultRadius: 'md',
  
  /** Font family (system fonts for performance) */
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace',
  
  /** Heading styles */
  headings: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '2rem', lineHeight: '1.3' },
      h2: { fontSize: '1.5rem', lineHeight: '1.35' },
      h3: { fontSize: '1.25rem', lineHeight: '1.4' },
      h4: { fontSize: '1.125rem', lineHeight: '1.45' },
      h5: { fontSize: '1rem', lineHeight: '1.5' },
      h6: { fontSize: '0.875rem', lineHeight: '1.5' },
    },
  },
  
  /** Spacing scale (8px grid) */
  spacing: {
    xs: '0.5rem',  // 8px
    sm: '0.75rem', // 12px
    md: '1rem',    // 16px
    lg: '1.5rem',  // 24px
    xl: '2rem',    // 32px
  },
  
  /** Component-specific overrides */
  components: {
    Button: {
      defaultProps: {
        size: 'md',
      },
    },
    TextInput: {
      defaultProps: {
        size: 'md',
      },
    },
    Select: {
      defaultProps: {
        size: 'md',
      },
    },
    Table: {
      defaultProps: {
        striped: true,
        highlightOnHover: true,
      },
    },
  },
});

/**
 * Status colors for asset management
 */
export const statusColors = {
  available: 'green',
  'in-use': 'blue',
  broken: 'red',
  'in-repair': 'orange',
  installed: 'cyan',
  sold: 'gray',
  destroyed: 'dark',
} as const;

/**
 * Booking status colors
 */
export const bookingStatusColors = {
  pending: 'yellow',
  approved: 'blue',
  active: 'green',
  completed: 'gray',
  overdue: 'red',
  cancelled: 'dark',
} as const;
