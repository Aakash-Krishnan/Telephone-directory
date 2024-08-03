import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// NOTE: The below code is specific for windows to get the dirname.
// Getting the current directory application directory path
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Adding the path to the db.json file
const dbPath = path.join(__dirname, "../db.json");
// Adding the path to the logs.txt file
const logsPath = path.join(__dirname, "../logs.txt");

// This function reads the logs from the logs.txt file.
export const readLogs = async () => {
  const file = await fs.readFile(logsPath, "utf-8");
  return file;
};

// This function writes the logs to the logs.txt file.
export const writeLogs = async (log) => {
  await fs.appendFile(logsPath, log);
};

// This function reads the db.json file and returns the parsed JSON object.
export const readDB = async () => {
  const file = await fs.readFile(dbPath, "utf-8");
  return JSON.parse(file);
};

// This function writes the new data to the db.json file.
export const writeDB = async ({ ipStore, contacts, phNo }) => {
  const newDb = { contacts, ipStore, phNo };
  await fs.writeFile(dbPath, JSON.stringify(newDb, null, 2));
};

// This function adds a new contact and the phone number to the db.json file.
export const insertContacts = async (newContact) => {
  const db = await readDB();

  db.contacts.push(newContact);
  db.phNo.push(newContact.phone);
  const { ipStore, contacts, phNo } = db;

  await writeDB({ ipStore, contacts, phNo });
  return newContact;
};
