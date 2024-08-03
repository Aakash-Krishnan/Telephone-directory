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

// Middleware to parse the body of the request
app.use(express.json());

// Middleware to log the request and check the rate limit.
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

// Home Route
app.get("/", async (_, res) => {
  return res.status(200).end(`
    Welcome to the contact book

    Pages you can try:

    1. GET      /                                           - for home Route,
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

// Logs Route - To get all the logs.
app.get("/logs", async (_, res) => {
  try {
    const logs = await getLogs();
    console.log(logs);
    return res.status(200).send(logs);
  } catch ({ message }) {
    res.status(400).json({ error: message });
  }
});

// Contacts Route - To get all the contacts by sorted and ordered.
app.get("/contacts", async (req, res) => {
  try {
    const sortBy = String(req.query.sort) || "createdAt";
    const order = String(req.query.order) || "asc";

    // This function will read the data, sort the contacts, and return the sorted contacts according to the given params.
    const orderedContacts = await sortContactsBy({ sortBy, order });

    if (orderedContacts.error) throw new Error(orderedContacts.error);

    return res.status(200).json({ contacts: orderedContacts });
  } catch ({ message }) {
    return res.status(400).json({ error: message });
  }
});

// Search contacts Route - To search the contacts by the query.
app.get("/contacts/search", async (req, res) => {
  try {
    const { q } = req.query;

    // This function will read the contacts, search the contacts by the query and return the searched contacts using Fuzzy search.
    const searchedContacts = await searchContacts({ q });

    if (searchedContacts.error) throw new Error(searchedContacts.error);

    return res.status(200).json({ searchedContacts });
  } catch ({ message }) {
    return res.status(400).json({ error: message });
  }
});

// Contact Route - To get a contact by id.
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

// Add contacts Route - To add a new contact.
app.post("/add-contacts", async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;

    if (!firstName) throw new Error("First name is required");
    if (!phone) throw new Error("Phone number is required");

    // This function will add a new contact and return the added contact.
    const contact = await newContact({ firstName, lastName, email, phone });
    return res.status(200).json({ contact });
  } catch ({ message }) {
    return res.status(400).json({ error: message });
  }
});

// Update contacts Route - To update a contact by id.
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

// Delete contacts Route - To delete all the contacts.
app.delete("/contacts", async (_, res) => {
  try {
    // This function will remove all the contacts and return the message
    const message = await removeAllContacts();

    if (message.error) throw new Error(message.error);

    return res.status(200).json({ message });
  } catch ({ message }) {
    return res.status(400).json({ error: message });
  }
});

// Delete contact Route - To delete a contact by id.
app.delete("/contacts/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // This function will remove the contact by id and return the removed contact.
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
