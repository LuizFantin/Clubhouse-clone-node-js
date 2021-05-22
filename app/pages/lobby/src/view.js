import { constants } from "../../_shared/constants.js";
import Room from "./entities/room.js";
import getTemplate from "./templates/lobbyItem.js";

const roomGrid = document.getElementById('roomGrid');

const btnCreateRoomWithTopic = document.getElementById('btnCreateRoomWithTopic');
const btnCreateRoomWithoutTopic = document.getElementById('btnCreateRoomWithoutTopic');
const txtTopic = document.getElementById('txtTopic');
const imgUser = document.getElementById('imgUser');

export default class View {

    static updateUserImage({img, username}) {
        imgUser.src = img;
        imgUser.alt = username;
    }
    
    static clearRoomList(){
        roomGrid.innerHTML = '';
    }

    static generateRoomLink({id, topic}) {
        return `./../room/index.html?id=${id}&topic=${topic}`;
    }

    static redirectToRoom(topic = '') {
        const uniqueId = Date.now().toString(36) + Math.random().toString(36).substring(2);
        window.location = View.generateRoomLink({
            id: uniqueId, 
            topic: topic
        });
    }

    static redirectToLogin() {
        window.location = constants.pages.login;
    }

    static configureCreateRoomButton() {
        btnCreateRoomWithTopic.addEventListener('click', () => {
            const topic = txtTopic.value;
            View.redirectToRoom(topic);
        });
        btnCreateRoomWithoutTopic.addEventListener('click', () => {
            View.redirectToRoom();
        });
    }

    static updateRoomList(rooms){
        View.clearRoomList();

        rooms.forEach(room => {
            const params = new Room({
                ...room,
                roomLink: View.generateRoomLink(room),
            });

            const htmlTemplate = getTemplate(params);

            roomGrid.innerHTML += htmlTemplate;
        });
    }
}