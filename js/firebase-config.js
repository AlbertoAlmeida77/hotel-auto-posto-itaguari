const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyCN13UThOrVQetF3hdHqbW3nJDCwacE7Z4",
  authDomain:        "sitehotelita.firebaseapp.com",
  projectId:         "sitehotelita",
  storageBucket:     "sitehotelita.firebasestorage.app",
  messagingSenderId: "578390699681",
  appId:             "1:578390699681:web:7fd750f9e91e05f8c3cae0",
  measurementId:     "G-7TX68H9LK8"
};

window.db = null;

(function iniciarFirebase() {
  if (FIREBASE_CONFIG.apiKey === "COLE_SUA_API_KEY_AQUI") return;
  try {
    if (typeof firebase === 'undefined') return;
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    window.db = firebase.firestore();
  } catch (erro) {
    console.error('Erro Firebase:', erro.message);
  }
})();
