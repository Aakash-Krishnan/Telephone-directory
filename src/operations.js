import { readDB, insertContacts, readLogs, writeDB, writeLogs } from "./db.js";
import { v4 as uuidv4 } from "uuid";

// This function appends the logs to the logs.txt file.
export const appendLogs = async ({ ip, date, time, url, method, flag }) => {
  try {
    const logMessage = `[IP: ${ip}] [${date}] [${time}] ${
      flag ? "Rate limit exceeded" : ""
    }: ${method} ${url} \n`;

    await writeLogs(logMessage);
    return;
  } catch (error) {
    return { error };
  }
};

// This function returns the logs from the logs.txt file.
export const getLogs = async () => {
  try {
    const logs = await readLogs();
    return logs;
  } catch (error) {
    return { error };
  }
};

export const createHashMap = (data) => {
  return new Map(data.map((item) => [item.id, item]));
};

export const createHashSet = (data) => {
  return new Set(data);
};

// This function adds a new contact to the db.json file.
export const newContact = async ({
  firstName,
  lastName = "",
  email = "",
  phone,
}) => {
  try {
    const { phNo } = await readDB();
    const phNoSet = createHashSet(phNo);

    if (phNoSet.has(phone)) return { error: "Phone number already exists" };

    const contact = {
      id: uuidv4(),
      firstName,
      lastName,
      email,
      phone,
      createdAt: Date.now(),
    };

    await insertContacts(contact);
    return contact;
  } catch (error) {
    return { error };
  }
};

// This function returns all the contacts from the db.json file.
export const getAllContacts = async () => {
  try {
    const { contacts } = await readDB();
    return contacts;
  } catch (error) {
    return { error };
  }
};

// This function returns a contact by id from the db.json file.
export const getContact = async (id) => {
  try {
    const { contacts } = await readDB();
    const contactsMap = createHashMap(contacts);

    if (contactsMap.has(id)) {
      return contactsMap.get(id);
    } else {
      throw new Error("Contact not found");
    }
  } catch (error) {
    return { error: error.message };
  }
};

// This function updates a contact by id in the db.json file.
export const updateContact = async ({ id, details }) => {
  try {
    const { contacts } = await readDB();
    const contactsMap = createHashMap(contacts);

    if (contactsMap.has(id)) {
      const contact = contactsMap.get(id);

      const updatedContact = { ...contact, ...details };
      contactsMap.set(id, updatedContact);
      const newContacts = [...contactsMap.values()];

      await writeDB({ contacts: newContacts });
      return { success: "Contact updated!", updatedContact };
    } else {
      throw new Error("No contact found");
    }
  } catch (error) {
    return { error: error.message };
  }
};

// This function removes a contact by id from the db.json file.
export const removeContact = async (id) => {
  try {
    const { contacts, ipStore, phNo } = await readDB();
    const contactsMap = createHashMap(contacts);
    const phNoSet = createHashSet(phNo);

    if (contactsMap.has(id)) {
      const deletedContactPhNo = contactsMap.get(id).phone;

      contactsMap.delete(id);
      phNoSet.delete(deletedContactPhNo);

      const newPhoneNos = [...phNoSet];
      const newContacts = [...contactsMap.values()];

      await writeDB({ ipStore, contacts: newContacts, phNo: newPhoneNos });
      return { success: "Contact removed", id };
    } else {
      throw new Error("No contact found");
    }
  } catch (error) {
    return { error: error.message };
  }
};

// This function removes all the contacts from the db.json file.
export const removeAllContacts = async () => {
  try {
    const { ipStore } = await readDB();
    await writeDB({ ipStore, contacts: [], phNo: [] });
    return { success: "All contacts removed" };
  } catch (error) {
    return { error: error.message };
  }
};

// This function returns the contacts by sorting and ordering them by the given field .
export const sortContactsBy = async ({ sortBy, order }) => {
  try {
    // Get all the contacts.
    const contacts = await getAllContacts();

    if (contacts.error) throw new Error(contacts.error);

    return contacts.sort((a, b) => {
      const valueA = sortBy === "phone" ? Number(a[sortBy]) : a[sortBy];
      const valueB = sortBy === "phone" ? Number(b[sortBy]) : b[sortBy];

      if (!valueA && valueB) return 1;
      if (!valueB && valueA) return -1;
      if (!valueA && !valueB) return 0;

      let comparison = 0;
      if (typeof valueA === "string" && typeof valueB === "string") {
        comparison = valueA.localeCompare(valueB);
      } else if (valueA instanceof Date && valueB instanceof Date) {
        comparison = valueA - valueB;
      } else if (typeof valueA === "number" && typeof valueB === "number") {
        comparison = valueA - valueB;
      } else {
        comparison = String(valueA).localeCompare(String(valueB));
      }

      return order === "asc" ? comparison : -comparison;
    });
  } catch (error) {
    return { error };
  }
};

// This function searches the contacts by the query and returns the searched contacts.
export const searchContacts = async ({ q }) => {
  try {
    const contacts = await getAllContacts();

    if (contacts.error) throw new Error(contacts.error);

    const search = q.toLowerCase();

    // Fuzzy search the contacts.
    return contacts.filter((contact) => {
      const values = Object.values(contact);
      return values.some((value) => {
        if (typeof value === "string") {
          return value.toLowerCase().includes(search);
        }
      });
    });
  } catch (error) {
    return { error };
  }
};
