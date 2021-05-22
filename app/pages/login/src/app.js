import { constants } from "../../_shared/constants.js";
import UserDb from "../../_shared/userDb.js";

function redirectToLobby() {
    window.location = constants.pages.lobby;
}

function onLogin({provider, firebase}) {
    return async () => {
        try {
            const result = await firebase
                .auth()
                .signInWithPopup(provider)

            const {user} = result;
            const userData = {
                img: user.photoURL,
                username: user.displayName
            }
            UserDb.insert(userData);
            redirectToLobby()
        } catch (error) {
            alert(JSON.stringify(error));
            console.log('Erro no auth github', error);
        }
    }
}

const currentUser = UserDb.get();
if(Object.keys(currentUser).length) {
    redirectToLobby();
}

// Initialize Firebase
firebase.initializeApp(constants.firebaseConfig);
firebase.analytics();

const provider = new firebase.auth.GithubAuthProvider();
provider.addScope('read:user');


const btnLogin = document.getElementById('btnLogin');
btnLogin.addEventListener('click', onLogin({provider, firebase}));