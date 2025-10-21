/* eslint-disable max-lines-per-function */
import { useState } from 'react';
import { AppShell, Burger, Group, NavLink, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconBox,
  IconCategory,
  IconClipboardList,
  IconHome,
  IconScan,
  IconSettings,
  IconCalendarEvent,
  IconPackage,
  IconKeyboard,
  IconChartBar,
  IconTool,
} from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { KeyboardShortcutsModal } from '../common/KeyboardShortcutsModal';

interface NavigationProps {
  children: React.ReactNode;
  onScanClick?: () => void;
}

export function Navigation({ children, onScanClick }: NavigationProps) {
  const [opened, { toggle }] = useDisclosure();
  const [shortcutsOpened, setShortcutsOpened] = useState(false);
  const location = useLocation();

  // Detect platform for correct keyboard shortcut display
  const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
  const scanShortcut = isMac ? '⌘S' : 'Alt+S';

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={3}>Inventory Manager</Title>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          component={Link}
          to="/"
          label="Dashboard"
          leftSection={<IconHome size={20} />}
          active={isActive('/')}
          onClick={() => {
            if (opened) toggle();
          }}
        />
        
        <NavLink
          component={Link}
          to="/categories"
          label="Categories"
          leftSection={<IconCategory size={20} />}
          active={isActive('/categories')}
          onClick={() => {
            if (opened) toggle();
          }}
        />
        
        <NavLink
          component={Link}
          to="/assets"
          label="Assets"
          leftSection={<IconBox size={20} />}
          active={isActive('/assets')}
          onClick={() => {
            if (opened) toggle();
          }}
        />

        <NavLink
          component={Link}
          to="/bookings"
          label="Bookings"
          leftSection={<IconCalendarEvent size={20} />}
          active={isActive('/bookings')}
          onClick={() => {
            if (opened) toggle();
          }}
        />

        <NavLink
          component={Link}
          to="/kits"
          label="Kits"
          leftSection={<IconPackage size={20} />}
          active={isActive('/kits')}
          onClick={() => {
            if (opened) toggle();
          }}
        />

        <NavLink
          component={Link}
          to="/stock-take"
          label="Stock Take"
          leftSection={<IconClipboardList size={20} />}
          active={isActive('/stock-take')}
          onClick={() => {
            if (opened) toggle();
          }}
        />

        <NavLink
          component={Link}
          to="/reports"
          label="Reports"
          leftSection={<IconChartBar size={20} />}
          active={isActive('/reports')}
          onClick={() => {
            if (opened) toggle();
          }}
        />

        <NavLink
          component={Link}
          to="/maintenance"
          label="Maintenance"
          leftSection={<IconTool size={20} />}
          active={isActive('/maintenance')}
          onClick={() => {
            if (opened) toggle();
          }}
        />

        <NavLink
          label="Quick Scan"
          description={scanShortcut}
          leftSection={<IconScan size={20} />}
          onClick={() => {
            if (opened) toggle();
            onScanClick?.();
          }}
        />
        
        <NavLink
          component={Link}
          to="/settings"
          label="Settings"
          leftSection={<IconSettings size={20} />}
          active={isActive('/settings')}
          onClick={() => {
            if (opened) toggle();
          }}
        />
        
        <NavLink
          label="Keyboard Shortcuts"
          description="View all shortcuts"
          leftSection={<IconKeyboard size={20} />}
          onClick={() => {
            if (opened) toggle();
            setShortcutsOpened(true);
          }}
        />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
      
      {/* T226: Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        opened={shortcutsOpened}
        onClose={() => setShortcutsOpened(false)}
      />
    </AppShell>
  );
}
