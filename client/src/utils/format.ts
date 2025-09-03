import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export function formatTRY(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return "₺0,00";
  
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(dateString: string, withTime = false): string {
  const date = new Date(dateString);
  
  if (withTime) {
    return format(date, "d MMMM yyyy HH:mm", { locale: tr });
  }
  
  return format(date, "d MMMM yyyy", { locale: tr });
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  
  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: tr,
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatDimensions(dimensions: [number, number, number]): string {
  return dimensions.map(d => d.toFixed(1)).join("×") + " mm";
}

export function formatVolume(volumeMm3: number): string {
  const volumeCm3 = volumeMm3 / 1000;
  return volumeCm3.toFixed(1) + " cm³";
}

export function formatWeight(weightG: number): string {
  return weightG.toFixed(1) + " gram";
}

export function formatPrintTime(minutes: number): string {
  const hours = minutes / 60;
  
  if (hours < 1) {
    return Math.round(minutes) + " dakika";
  } else if (hours < 24) {
    return hours.toFixed(1) + " saat";
  } else {
    const days = hours / 24;
    return days.toFixed(1) + " gün";
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
