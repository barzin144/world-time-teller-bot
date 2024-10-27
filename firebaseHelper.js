import { initializeApp, cert } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const serviceAccount =
{
  type: process.env.TYPE,
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY.replace(/\\n/gm, "\n"),
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL
}

console.log(serviceAccount);
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
