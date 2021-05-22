export const constants = {
    socketUrl: 'http://localhost:3000',
    socketNamespaces: {
        room: 'room',
        lobby: 'lobby'
    },
    peerConfig: Object.values({
        id: undefined,
        // config: {
        //     port: 9000,
        //     host: 'localhost',
        //     path: '/'
        // }
    }),
    pages: {
        lobby: '/pages/lobby',
        login: '/pages/login'
    },
    events: {
        USER_CONNECTED: 'userConnection',
        USER_DISCONNECTED: 'userDisconnection',
        JOIN_ROOM: 'joinRoom',
        LOBBY_UPDATED: 'lobbyUpdated',
        UPGRADE_USER_PERMISSION: 'upgradeUserPermission',

        SPEAK_REQUEST: 'speakRequest',
        SPEAK_ANSWER: 'speakAnswer'
    },
    firebaseConfig: {
        apiKey: "AIzaSyDSsV0UMMVC9MMkSejhO--FpAgVGtUweeo",
        authDomain: "clubhouse-clone-1da96.firebaseapp.com",
        projectId: "clubhouse-clone-1da96",
        storageBucket: "clubhouse-clone-1da96.appspot.com",
        messagingSenderId: "585040026733",
        appId: "1:585040026733:web:0465bd392446b8bbe23364",
        measurementId: "G-EZWXTZT0D9"
    },
    storageKey: 'clubhouse:clone:storage:user'
}