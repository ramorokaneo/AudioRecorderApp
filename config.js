import { firebase } from "firebase/compat/app";
import 'fire/compat/auth';
import 'firebase/compat/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyBQBLgDsVv3Tl0oWizGaAHQ6WYXh0v_CUs",
  authDomain: "the-app-7f567.firebaseapp.com",
  projectId: "the-app-7f567",
  storageBucket: "the-app-7f567.appspot.com",
  messagingSenderId: "398014330647",
  appId: "1:398014330647:web:a03202093f78f5a56aa952"
};


if (!firebase.apps.legnth){
  firebase.initializeApp(firebaseConfig);
}

export{firebase};