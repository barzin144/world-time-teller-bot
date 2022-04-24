import { promises as fs } from "fs";
import { initializeApp, cert } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
const serviceAccount = JSON.parse(await fs.readFile("./serviceAccountKey.json"));

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const setData = async (data) => {
  const docRef = db.collection("usersConfig").doc(data.user_id.toString());
  await docRef.set({ timezones: data.timezones });
};

const readData = async (user_id) => {
  const docRef = db.collection("usersConfig").doc(user_id.toString());
  const doc = await docRef.get();
  if (!doc.exists) {
    return null;
  } else {
    return doc.data();
  }
};

const saveUserConfig = async (user_id, timezone) => {
  const docRef = db.collection("usersConfig").doc(user_id.toString());
  await docRef.update({ timezones: FieldValue.arrayUnion(timezone) });
};

const resetUserConfig = async (user_id) => {
  const docRef = db.collection("usersConfig").doc(user_id.toString());
  await docRef.set({ timezones: [] });
};

export { setData, readData, saveUserConfig, resetUserConfig };
