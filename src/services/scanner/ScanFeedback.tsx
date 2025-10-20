import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';

/**
 * Plays a success beep sound when a barcode is successfully scanned
 */
export function playScanSuccessSound(): void {
  try {
    const audioContext = new AudioContext();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure beep sound (higher pitch, short duration)
    oscillator.frequency.value = 800; // Hz
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (err) {
    // Silently fail if audio context not supported
    console.error('Failed to play scan sound:', err);
  }
}

/**
 * Plays an error beep sound when a scan fails
 */
export function playScanErrorSound(): void {
  try {
    const audioContext = new AudioContext();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure error sound (lower pitch, longer duration)
    oscillator.frequency.value = 200; // Hz
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (err) {
    // Silently fail if audio context not supported
    console.error('Failed to play error sound:', err);
  }
}

/**
 * Shows a success notification with visual feedback
 */
export function showScanSuccess(assetNumber: string, assetName?: string): void {
  notifications.show({
    title: 'Scan Successful',
    message: assetName ? `${assetName} (${assetNumber})` : assetNumber,
    color: 'green',
    icon: <IconCheck size={16} />,
    autoClose: 3000,
  });
}

/**
 * Shows an error notification with visual feedback
 */
export function showScanError(message: string): void {
  notifications.show({
    title: 'Scan Failed',
    message,
    color: 'red',
    icon: <IconX size={16} />,
    autoClose: 5000,
  });
}

/**
 * Combined feedback for successful scan (sound + visual)
 */
export function provideScanSuccessFeedback(
  assetNumber: string,
  assetName?: string,
  options: { sound?: boolean; notification?: boolean } = {}
): void {
  const { sound = true, notification = true } = options;

  if (sound) {
    playScanSuccessSound();
  }

  if (notification) {
    showScanSuccess(assetNumber, assetName);
  }
}

/**
 * Combined feedback for failed scan (sound + visual)
 */
export function provideScanErrorFeedback(
  message: string,
  options: { sound?: boolean; notification?: boolean } = {}
): void {
  const { sound = true, notification = true } = options;

  if (sound) {
    playScanErrorSound();
  }

  if (notification) {
    showScanError(message);
  }
}
