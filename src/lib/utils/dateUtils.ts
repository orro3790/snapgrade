// src/lib/utils/dateUtils.ts
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Ensures a value is converted to a JavaScript Date object
 * Handles various input types including Firestore Timestamps
 * @param value The value to convert (could be Date, Firestore Timestamp, or other)
 * @returns A JavaScript Date object
 */
export function ensureDate(value: unknown): Date {
  // If it's null or undefined, return current date
  if (value == null) {
    return new Date();
  }
  
  // If it's already a Date, return it
  if (value instanceof Date) {
    return value;
  }
  
  // If it's a Firestore Timestamp
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  
  // Default fallback
  return new Date();
}