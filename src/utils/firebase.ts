import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDlYKKlId_LmhPzvp-KT_WsK__bL3jVdN8",
  authDomain: "eandb-38e33.firebaseapp.com",
  projectId: "eandb-38e33",
  storageBucket: "eandb-38e33.firebasestorage.app",
  messagingSenderId: "900070441370",
  appId: "1:900070441370:web:26cf290e8a425bc441fa23",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CODES_COLLECTION = "codes";

export async function addCodeCollection(codesArr: string[]) {
  const codesCollectionRef = collection(db, CODES_COLLECTION);

  const q = query(codesCollectionRef, where("latest", "==", true));
  const querySnapshot = await getDocs(q);
  const batch = writeBatch(db);

  querySnapshot.forEach((doc) => {
    batch.update(doc.ref, { latest: false });
  });

  await batch.commit();

  await addDoc(collection(db, CODES_COLLECTION), {
    updated: Date.now(),
    codes: codesArr,
    latest: true,
  });
}

export async function getLatestCodes() {
  const q = query(
    collection(db, CODES_COLLECTION),
    where("latest", "==", true)
  );
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const data = snapshot.docs[0].data();
    // Проверяем, существует ли поле codes и является ли оно массивом
    if (data.codes && Array.isArray(data.codes)) {
      return data.codes as string[];
    }
  }

  return []; // Возвращаем пустой массив, если актуальный объект не найден
}

// Функция для обновления документа, где latest: true
export async function updateLatestDocument(newCodes: string[]) {
  const codesCollectionRef = collection(db, CODES_COLLECTION);
  const q = query(codesCollectionRef, where("latest", "==", true));

  try {
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      // Предполагаем, что у нас только один актуальный документ
      const documentToUpdate = querySnapshot.docs[0];
      await updateDoc(documentToUpdate.ref, {
        updated: Date.now(),
        codes: newCodes,
      });
    } else {
      await addCodeCollection(newCodes);
    }
  } catch (error) {
    throw Error(`Error updating document: ${error}`);
  }
}
