import { Mail, MessageCircle, Phone, Smartphone, type LucideIcon } from "lucide-react";
import type { NotificationChannel } from "@/types/notification.types";

export interface ChannelMeta {
  key: NotificationChannel;
  label: string;
  icon: LucideIcon;
  /** Email / SMS / Voice Call send in bulk; WhatsApp goes one guest at a time. */
  bulk: boolean;
  description: string;
}

export const CHANNELS: ChannelMeta[] = [
  {
    key: "WHATSAPP",
    label: "WhatsApp",
    icon: MessageCircle,
    bulk: false,
    description:
      "One guest at a time. Tap Send and WhatsApp opens with the invitation ready - press send there.",
  },
  {
    key: "EMAIL",
    label: "Email",
    icon: Mail,
    bulk: true,
    description:
      "Select guests and send in bulk. Sent from LavernaEvents in your name - guest replies come to your email.",
  },
  {
    key: "SMS",
    label: "SMS",
    icon: Smartphone,
    bulk: true,
    description: "Select guests and send in bulk. A text message with the RSVP link.",
  },
  {
    key: "VOICE_CALL",
    label: "Voice Call",
    icon: Phone,
    bulk: true,
    description:
      "Select guests and send in bulk. An automated call reads the invitation aloud. Uses your voice call credits.",
  },
];

export const CHANNEL_META = CHANNELS.reduce(
  (accumulator, channel) => {
    accumulator[channel.key] = channel;
    return accumulator;
  },
  {} as Record<NotificationChannel, ChannelMeta>
);