import {
  IconMicrophone,
  IconDeviceTv,
  IconBulb,
  IconCamera,
  IconMusic,
  IconHeadphones,
  IconDeviceSpeaker,
  IconPlugConnected,
  IconWifi,
  IconRouter,
  IconDeviceLaptop,
  IconDeviceDesktop,
  IconKeyboard,
  IconMouse,
  IconPrinter,
  IconPresentation,
  IconQuestionMark,
} from '@tabler/icons-react';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number | string }>> = {
  'Microphone': IconMicrophone,
  'TV/Display': IconDeviceTv,
  'Lighting': IconBulb,
  'Camera': IconCamera,
  'Music': IconMusic,
  'Headphones': IconHeadphones,
  'Speaker': IconDeviceSpeaker,
  'Connector': IconPlugConnected,
  'Cable': IconWifi,
  'Network': IconRouter,
  'Laptop': IconDeviceLaptop,
  'Desktop': IconDeviceDesktop,
  'Keyboard': IconKeyboard,
  'Mouse': IconMouse,
  'Printer': IconPrinter,
  'Projector': IconPresentation,
};

interface IconDisplayProps {
  iconName?: string;
  size?: number | string;
}

export function IconDisplay({ iconName, size = 20 }: IconDisplayProps) {
  if (!iconName) {
    return <IconQuestionMark size={size} />;
  }

  const IconComponent = ICON_MAP[iconName] || IconQuestionMark;
  return <IconComponent size={size} />;
}
