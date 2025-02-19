import { z } from 'zod';
// The transform() here ensures email consistency by converting to lowercase
// Flow: raw email string -> validation -> lowercase transformation
export const loginSchema = z.object({
    email: z.string()
        .email('Please enter a valid email address')
        .transform(email => email.toLowerCase()),
    password: z.string().min(1, 'Password is required'),
});
// Password validation schema with multiple regex checks
// Each regex ensures different aspects of password strength
const registrationPasswordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number');
export const locationSchema = z.object({
    city: z.string()
        .min(1, 'City is required')
        .max(100, 'City name is too long')
        .regex(/^[a-zA-Z\s\-'.]+$/, 'City name can only contain letters, spaces, hyphens, apostrophes, and periods')
        .transform(city => city.trim().replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())),
});
// All transforms here handle basic data cleaning (trimming, lowercase)
export const signUpSchema = z.object({
    email: z.string()
        .email('Invalid email address')
        .transform(email => email.toLowerCase()),
    password: registrationPasswordSchema,
    confirmPassword: registrationPasswordSchema,
    acceptTerms: z.boolean()
        .refine((val) => val === true, {
        message: "You must accept the terms and conditions"
    }),
    firstName: z.string().min(1, 'First name is required')
        .transform(str => str.trim()),
    lastName: z.string().min(1, 'Last name is required')
        .transform(str => str.trim()),
    dateOfBirth: z.string()
        .regex(/^(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])$/, 'Please use YYYYMMDD format with valid date'),
    gender: z.enum([
        'male',
        'female',
    ]),
    location: locationSchema
});
