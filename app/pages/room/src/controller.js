import { constants } from "../../_shared/constants.js";
import Attendee from "./entities/attendee.js";

export default class RoomController {
    constructor({socketBuilder, roomInfo, view, peerBuilder, roomService}){
        this.socketBuilder = socketBuilder;
        this.peerBuilder = peerBuilder;
        this.roomInfo = roomInfo;
        this.view = view;
        this.roomService = roomService;

        this.socket = {};
    }

    static async initialize(deps) {
        return new RoomController(deps)._initialize();
    }

    async _initialize() {

        this._setupViewEvents();
        await this.roomService.init();
        this.socket = this._setupSocket();
        this.roomService.setCurrentPeer(await this._setupWebRTC());


    }

    _setupViewEvents() {
        this.view.updateUserImage(this.roomInfo.user)
        this.view.updateRoomTopic(this.roomInfo.room)
    }

    _setupSocket() {
        return this.socketBuilder
            .setOnUserConnected(this.onUserConnected())
            .setOnUserDisconnected(this.onUserDisconnected())
            .setOnRoomUpdated(this.onRoomUpdated())
            .setOnUserProfileUpgrade(this.onUserProfileUpgrade())
            .build();
    }

    async _setupWebRTC() {
        return this.peerBuilder
            .setOnError(this.onPeerError())
            .setOnConnectionOpened(this.onPeerConnectionOpened())
            .setOnCallReceived(this.onCallReceived())
            .setOnCallError(this.onCallError())
            .setOnCallClose(this.onCallClose())
            .setOnStreamReceived(this.onStreamReceived())
            .build();
    }

    onStreamReceived() {
        return (call, stream) => { 
            console.log('Stream Received', call, stream);
            const callerId = call.peer;
            const {isCurrentId} = this.roomService.addReceivedPeer(call);
            this.view.renderAudioElement({
                callerId,
                stream,
                isCurrentId
            })
        };
    }

    onCallClose() {
        return (call) => { 
            console.log('Call closed', call);
            const peerId = call.peer;
            this.roomService.disconnectPeer({peerId});
        };
    }

    onCallError() {
        return (call, error) => { 
            console.log('Call error', call, error);
            const peerId = call.peer;
            this.roomService.disconnectPeer({peerId});
        };
    }

    onCallReceived() {
        return async (call) => { 
            
            const stream = await this.roomService.getCurrentStream();
            console.log('Call Received', call);
            call.answer(stream);

        };
    }

    onPeerError() {
        return (error) => {
            console.error('erroooor peer', error);
         };
    }

    onPeerConnectionOpened() {
        return (peer) => { 
            console.log('peeeeeeeer', peer);
            this.roomInfo.user.peerId = peer.id;
            this.socket.emit(constants.events.JOIN_ROOM, this.roomInfo);
        };
    }

    onRoomUpdated() {
        return (data) => {
            const users = data.map(item => new Attendee(item));

            this.view.updateAttendeesOnGrid(users)
            this.roomService.updateCurrentUserProfile(users);
            this.activateUserFeatures();
            console.log('room users list', users);
        };
    }

    onUserDisconnected() {
        return (data) => {
            const attendee = new Attendee(data);

            console.log(`${attendee.username} exterminated`);
            this.view.removeItemFromGrid(attendee.id);
            
            this.roomService.disconnectPeer(attendee);

        };
    }

    onUserConnected() {
        return (data) => {
            const attendee = new Attendee(data);
            console.log('user arrives', attendee);
            this.view.addAttendeeOnGrid(attendee);

            this.roomService.callNewUser(attendee);
        };
    }

    onUserProfileUpgrade() {
        return (data) => {
            const attendee = new Attendee(data);
            console.log('user upgraded', attendee);
            this.roomService.upgradeUserPermission(attendee);

            if(attendee.isSpeaker){
                this.view.addAttendeeOnGrid(attendee, true)
            }
            this.activateUserFeatures();
        };
    }

    activateUserFeatures() {
        const currentUser = this.roomService.getCurrentUser();
        this.view.showUserFeatures(currentUser.isSpeaker);
    }
}