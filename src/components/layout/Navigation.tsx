/* eslint-disable max-lines-per-function */
import { AppShell, Burger, Group, NavLink, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconBox,
  IconCategory,
  IconClipboardList,
  IconHistory,
  IconHome,
  IconScan,
} from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';

interface NavigationProps {
  children: React.ReactNode;
  onScanClick?: () => void;
}

export function Navigation({ children, onScanClick }: NavigationProps) {
  const [opened, { toggle }] = useDisclosure();
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
          to="/stock-take"
          label="Stock Take"
          leftSection={<IconClipboardList size={20} />}
          active={isActive('/stock-take')}
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
          to="/history"
          label="Change History"
          leftSection={<IconHistory size={20} />}
          active={isActive('/history')}
          onClick={() => {
            if (opened) toggle();
          }}
          disabled
          description="Coming soon"
        />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
