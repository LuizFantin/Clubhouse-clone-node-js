import { constants } from "../../_shared/constants.js";

export default class LobbyController {
    constructor({socketBuilder, user, view}){
        this.socketBuilder = socketBuilder;
        this.user = user;
        this.view = view;

        this.socket = {};
    }

    static async initialize(deps) {
        return new LobbyController(deps)._initialize();
    }

    async _initialize() {

        this._setupViewEvents();
        this.socket = this._setupSocket();

        this.socket.emit(constants.events.JOIN_ROOM, this.roomInfo);
    }

    _setupViewEvents() {
        this.view.updateUserImage(this.user);
        this.view.configureCreateRoomButton();
    }

    _setupSocket() {
        return this.socketBuilder
            .setOnLobbyUpdated(this.onLobbyUpdated())
            .build();
    }

    onLobbyUpdated() {
        return (rooms) => {
            console.log('rooms', rooms);
            this.view.updateRoomList(rooms);
        }
    }
}