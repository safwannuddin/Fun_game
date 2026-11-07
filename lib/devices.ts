import type { DecoyId, DeviceId, RoomItemId } from "./types";

export const DEVICES: Record<DeviceId, { name: string; short: string }> = {
  laptop: { name: "Laptop", short: "laptop" },
  monitor: { name: "Email inbox", short: "monitor" },
  phone: { name: "Phone", short: "phone" },
  usb: { name: "USB stick", short: "USB stick" },
  router: { name: "Wi-Fi router", short: "router" },
  sticky: { name: "Sticky note", short: "sticky note" },
  qr: { name: "Pizza poster", short: "poster" },
};

export const DECOYS: Record<DecoyId, { name: string; line: string }> = {
  plant: { name: "Plant", line: "Just a plant. It has never been online." },
  lamp: { name: "Lamp", line: "A normal lamp. No chip, no Wi-Fi, no problem." },
  mug: { name: "Mug", line: "Coffee. Pixel's only weakness." },
};

export const DEVICE_IDS = Object.keys(DEVICES) as DeviceId[];

export function isDevice(id: RoomItemId): id is DeviceId {
  return id in DEVICES;
}

export function itemName(id: RoomItemId): string {
  return isDevice(id) ? DEVICES[id].name : DECOYS[id].name;
}
