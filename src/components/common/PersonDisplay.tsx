/**
 * PersonDisplay Component
 * 
 * Displays a person's name with their avatar/icon.
 * Can be used inline or as a standalone component.
 * Fetches person data by ID if only ID is provided.
 */

import { useState, useEffect } from 'react';
import { Group, Avatar, Text, Skeleton } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import { personSearchService } from '../../services/person/PersonSearchService';
import type { PersonSearchResult } from '../../services/person/PersonSearchService';

interface PersonDisplayProps {
  /** Person ID (will fetch data) */
  personId?: string;
  /** Pre-loaded person name (if ID not available or already fetched) */
  personName?: string;
  /** Pre-loaded person avatar URL */
  avatarUrl?: string;
  /** Size of the avatar */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Text size */
  textSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Text weight */
  textWeight?: number;
  /** Show only name without avatar */
  nameOnly?: boolean;
  /** Fallback text if no data available */
  fallback?: string;
}

function LoadingState({ nameOnly, size }: { nameOnly: boolean; size: string }) {
  if (nameOnly) return <Skeleton height={20} width={100} />;
  return (
    <Group gap="xs">
      <Skeleton height={size === 'xs' ? 16 : size === 'sm' ? 24 : 32} circle />
      <Skeleton height={16} width={100} />
    </Group>
  );
}

export function PersonDisplay({
  personId,
  personName,
  avatarUrl,
  size = 'sm',
  textSize = 'sm',
  textWeight,
  nameOnly = false,
  fallback = '—',
}: PersonDisplayProps) {
  const [personData, setPersonData] = useState<PersonSearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (personId && !personName) {
      setLoading(true);
      personSearchService
        .getPersonById(personId)
        .then(person => setPersonData(person))
        .catch(err => console.error('Failed to load person data:', err))
        .finally(() => setLoading(false));
    }
  }, [personId, personName]);

  const displayName = personName || personData?.displayName;
  const displayAvatar = avatarUrl || personData?.avatarUrl;

  if (loading) return <LoadingState nameOnly={nameOnly} size={size} />;
  if (!displayName) return <Text size={textSize} c="dimmed">{fallback}</Text>;
  if (nameOnly) return <Text size={textSize} fw={textWeight}>{displayName}</Text>;

  return (
    <Group gap="xs" wrap="nowrap">
      <Avatar src={displayAvatar} size={size} radius="xl">
        <IconUser size={size === 'xs' ? 12 : size === 'sm' ? 16 : 20} />
      </Avatar>
      <Text size={textSize} fw={textWeight}>{displayName}</Text>
    </Group>
  );
}
