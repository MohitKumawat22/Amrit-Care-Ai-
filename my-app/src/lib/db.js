/**
 * db.js — Legacy shim. Redirects to the hardened mongodb.ts connection.
 * This file exists so routes that haven't been updated yet continue to work.
 * All new code should import directly from "@/lib/mongodb".
 */
export { default } from "@/lib/mongodb";
