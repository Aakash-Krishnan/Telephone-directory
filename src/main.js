import express from "express";
import { rateLimiter } from "./rateLimitter.js";
import {
  getContact,
  newContact,
  removeAllContacts,
  removeContact,
  sortContactsBy,
  updateContact,
  searchContacts,
  appendLogs,
  getLogs,
} from "./operations.js";

const app = express();
const port = 8000;
const host = "127.0.0.1";

app.use(express.json());

app.use(async (req, res, next) => {
  const ip = req.ip;
  const url = req.url;
  const method = req.method;
  const date = new Date().toDateString();
  const time = new Date().toTimeString();

  const flag = await rateLimiter(ip);
  await appendLogs({ ip, date, time, url, method, flag });

  if (flag) {
    return res.status(429).end("Too many request, try again after sometime");
  } else {
    next();
  }
});

app.get("/", async (_, res) => {
  return res.status(200).end(`
    Welcome to the contact book

    Pages you can try:

    1. GET      /                                           - for home page,
    2. GET      /contacts?sort=createdAt&order=asc|desc     - to get all contacts,
    3. GET      /contacts/:id                               - to get a contact by id,
    4. GET      /contacts/search?q=                         - to search contacts Fuzzy search,
    5. POST     /add-contacts                               - to add a new contact,
    6. PATCH    /contacts/:id                               - to update a contact,
    7. DELETE   /contacts                                   - to delete all contacts,
    8. DELETE   /contacts/:id                               - to delete a contact by id,
    9. GET      /logs                                       - to get all logs
    `);
});

app.get("/logs", async (_, res) => {
  try {
    const logs = await getLogs();
    console.log(logs);
    return res.status(200).send(logs);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/contacts", async (req, res) => {
  try {
    const sortBy = String(req.query.sort) || "createdAt";
    const order = String(req.query.order) || "asc";

    const orderedContacts = await sortContactsBy({ sortBy, order });

    if (orderedContacts.error) throw new Error(orderedContacts.error);

    return res.status(200).json({ contacts: orderedContacts });
  } catch ({ message }) {
    return res.status(400).json({ error: message });
  }
});

app.get("/contacts/search", async (req, res) => {
  try {
    const { q } = req.query;

    const searchedContacts = await searchContacts({ q });

    if (searchedContacts.error) throw new Error(searchedContacts.error);

    return res.status(200).json({ searchedContacts });
  } catch ({ message }) {
    return res.status(400).json({ error: message });
  }
});

app.get("/contacts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await getContact(id);

    if (contact.error) throw new Error(contact.error);

    return res.status(200).json({ contact });
  } catch ({ message }) {
    return res.status(400).json({ error: message });
  }
});

app.post("/add-contacts", async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;

    if (!firstName) throw new Error("First name is required");
    if (!phone) throw new Error("Phone number is required");

    const contact = await newContact({ firstName, lastName, email, phone });
    return res.status(200).json({ contact });
  } catch ({ message }) {
    return res.status(400).json({ error: message });
  }
});

app.patch("/contacts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const details = req.body;
    const contact = await updateContact({ id, details });

    if (contact.error) throw new Error(contact.error);

    return res.status(200).json({ contact });
  } catch ({ message }) {
    return res.status(400).json({ error: message });
  }
});

app.delete("/contacts", async (_, res) => {
  try {
    const message = await removeAllContacts();

    if (message.error) throw new Error(message.error);

    return res.status(200).json({ message });
  } catch ({ message }) {
    return res.status(400).json({ error: message });
  }
});

app.delete("/contacts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await removeContact(id);

    if (contact.error) throw new Error(contact.error);

    return res.status(200).json({ contact });
  } catch ({ message }) {
    return res.status(400).json({ error: message });
  }
});

app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}/`);
});
