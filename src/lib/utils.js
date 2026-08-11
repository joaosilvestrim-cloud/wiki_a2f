import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function sanitizeFileName(fileName) {
  // Remove special characters, accents, and spaces
  const cleanedName = fileName
    .normalize("NFD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritical marks
    .replace(/[^\w.-]/g, '_') // Replace non-word characters (except . and -) with _
    .replace(/\s+/g, '_'); // Replace spaces with _
  
  // Split filename and extension
  const parts = cleanedName.split('.');
  if (parts.length > 1) {
    const extension = parts.pop();
    const name = parts.join('.');
    // Truncate name part if too long to avoid issues, keeping extension
    return `${name.substring(0, 50)}.${extension}`;
  }
  
  return cleanedName.substring(0, 50);
}