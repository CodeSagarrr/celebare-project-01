import { customAlphabet } from "nanoid";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

// photographer id, email address 
export const generatePhotographerId = customAlphabet(ALPHABET, 10);

export const generatePaymentRef = customAlphabet(ALPHABET, 8);


export const generateId = (length = 10) =>
customAlphabet(ALPHABET, length)();