import React, { Component, type ReactNode } from 'react';
import { Alert, Button, Group, Stack, Text } from '@mantine/core';
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Alert
          icon={<IconAlertTriangle size={16} />}
          title="Something went wrong"
          color="red"
          variant="light"
        >
          <Stack gap="sm">
            <Text size="sm">
              An unexpected error occurred. This has been logged and will be investigated.
            </Text>
            {import.meta.env.DEV && this.state.error && (
              <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
                {this.state.error.message}
              </Text>
            )}
            <Group>
              <Button
                size="xs"
                variant="light"
                leftSection={<IconRefresh size={14} />}
                onClick={this.handleRetry}
              >
                Try Again
              </Button>
            </Group>
          </Stack>
        </Alert>
      );
    }

    return this.props.children;
  }
}