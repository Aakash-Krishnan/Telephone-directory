import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../db.json");
const logsPath = path.join(__dirname, "../logs.txt");

export const readLogs = async () => {
  const file = await fs.readFile(logsPath, "utf-8");
  return file;
};

export const writeLogs = async (log) => {
  await fs.appendFile(logsPath, log);
};

export const readDB = async () => {
  const file = await fs.readFile(dbPath, "utf-8");
  return JSON.parse(file);
};

export const writeDB = async ({ ipStore, contacts, phNo }) => {
  const newDb = { contacts, ipStore, phNo };
  await fs.writeFile(dbPath, JSON.stringify(newDb, null, 2));
};

export const insertContacts = async (newContact) => {
  const db = await readDB();

  db.contacts.push(newContact);
  db.phNo.push(newContact.phone);
  const { ipStore, contacts, phNo } = db;

  await writeDB({ ipStore, contacts, phNo });
  return newContact;
};
