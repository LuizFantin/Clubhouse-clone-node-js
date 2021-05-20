import Attendee from "../entities/attendee.js";
import Room from "../entities/room.js";
import { constants } from "../util/constants.js";
import CustomMap from "../util/customMap.js";

export default class RoomsController {
    #users = new Map();

    constructor({roomsPubSub}) {
        this.roomsPubSub = roomsPubSub;
        this.rooms = new CustomMap({
            observer: this.#roomObserver(),
            customMapper: this.#mapRoom.bind(this)
        });
    }

    #roomObserver() {
        return {
            notify: (rooms) => this.notifyRoomSubscribers(rooms)
        }
    }

    speakAnswer(socket, { answer, user }) {
        // Altera o usuário de acordo com a resposta
        const userId = user.id
        const currentUser = this.#users.get(user.id);
        const updatedUser = new Attendee({
            ...currentUser,
            isSpeaker: answer,
        });

        this.#users.set(userId, updatedUser);

        // Atualiza o usuário na listagem de usuários da sala
        const roomId = user.roomId;
        const room = this.rooms.get(roomId);
        const userOnRoom = [...room.users.values()].find(({id}) => id === userId);
        room.users.delete(userOnRoom);
        room.users.add(updatedUser);
        this.rooms.set(roomId, room);

        // Volta para ele mesmo
        socket.emit(constants.event.UPGRADE_USER_PERMISSION, updatedUser);

        // Notifica a sala inteira para ligar para o novo speaker
        this.#notifyUserProfileUpgrade(socket, roomId, updatedUser);
    }

    speakRequest(socket) {
        // Envia para o dono da sala a solicitação de um attendee querendo ser speaker.
        const userId = socket.id;
        const user = this.#users.get(userId);
        const roomId = user.roomId;
        const owner = this.rooms.get(roomId)?.owner;
        socket.to(owner.id).emit(constants.event.SPEAK_REQUEST, user);
    }

    notifyRoomSubscribers(rooms) {
        const event = constants.event.LOBBY_UPDATED;
        this.roomsPubSub.emit(event, [...rooms.values()]);
    }

    onNewConnection(socket) {
        const {id} = socket;

        console.log('connection stablished with', id);

        this.#updateGlobalUserData(id);

    }

    disconnect(socket) {
        console.log('Disconnect!!', socket.id)
        this.#logoutUser(socket);
        
    }

    #logoutUser(socket) {
        const userId = socket.id;
        const user = this.#users.get(userId);
        const roomId = user.roomId;

        //remover user da lista de user ativos
        this.#users.delete(userId);

        //tratamos situação de um user que estava em uma sala que não existe mais
        if(!this.rooms.has(roomId))
            return;
        
        const room = this.rooms.get(roomId);
        const userToBeRemoved = [...room.users].find(({id}) => id === userId);

        //remover user da sala
        room.users.delete(userToBeRemoved);

        // se não tiver mais usuário na sala, removemos ela
        if(!room.users.size) {
            this.rooms.delete(roomId);
            return;
        }

        // checar se o usuario que saiu era o dono da sala
        const disconnectedUserWasOwner = userId === room.owner.id;
        const onlyOneUserLeft = room.users.size === 1;
        if(onlyOneUserLeft || disconnectedUserWasOwner) {
            room.owner = this.#getNewRoomOwner(room, socket);
        }

        // atualiza a sala no final
        this.rooms.set(roomId, room);

        //notifica a sala que o usuario se desconectou
        socket.to(roomId).emit(constants.event.USER_DISCONNECTED, user);


    }

    #notifyUserProfileUpgrade(socket, roomId, user){
        socket.to(roomId).emit(constants.event.UPGRADE_USER_PERMISSION, user);
    }

    #getNewRoomOwner(room, socket) {
        const users = [...room.users.values()];
        const oldestActiveSpeaker = users.find(user => user.isSpeaker);
        // Se quem desconectou era o dono, passa a liderança para o próximo
        // Se não houver speakers, promove o attendee mais antigo, ou seja, o primeiro user no array de users
        const [newOwner] = oldestActiveSpeaker ? [oldestActiveSpeaker] : users
        newOwner.isSpeaker = true;

        const outdatedUser = this.#users.get(newOwner.id);
        const updatedUser = new Attendee({
            ...outdatedUser,
            ...newOwner,
        });

        this.#users.set(newOwner.id, updatedUser);

        this.#notifyUserProfileUpgrade(socket, room.id, newOwner);
        return newOwner;
    }

    joinRoom(socket, { user, room}) {

        const userId = user.id = socket.id;
        const roomId = room.id;

        const updatedUserData = this.#updateGlobalUserData(
            userId,
            user,
            roomId
        );

        const updatedRoom = this.#joinUserRoom(socket, updatedUserData, room);

        this.#notifyUsersOnRoom(socket, roomId, updatedUserData);
        this.#replyWithActiveUsers(socket, updatedRoom.users);
    }

    #replyWithActiveUsers(socket, users) {
        const event = constants.event.LOBBY_UPDATED;
        socket.emit(event, [...users.values()]);
    }

    #notifyUsersOnRoom(socket, roomId, user) {
        const event = constants.event.USER_CONNECTED;
        socket.to(roomId).emit(event, user);
    }

    #joinUserRoom(socket, user, room) {
        const roomId = room.id;
        const existingRoom = this.rooms.has(roomId);
        const currentRoom = existingRoom ? this.rooms.get(roomId) : {};

        const currentUser = new Attendee({
            ...user,
            roomId,
        });

        //Dono da sala
        const [owner, users] = existingRoom ?
            [currentRoom.owner, currentRoom.users] : 
            [currentUser, new Set()];
        
        const updatedRoom = this.#mapRoom({
            ...currentRoom,
            ...room,
            owner,
            users: new Set([...users, ...[currentUser]])
        });

        this.rooms.set(roomId, updatedRoom);

        socket.join(roomId);

        return this.rooms.get(roomId);
    }

    #mapRoom(room) {
        const users = [...room.users.values()];
        const speakersCount = users.filter(user => user.isSpeaker).length;
        const featuredAttendees = users.slice(0,3);
        const mappedRoom = new Room({
            ...room,
            featuredAttendees,
            speakersCount,
            attendeesCount: room.users.size
        });

        return mappedRoom;

    }

    #updateGlobalUserData(userId, userData = {}, roomId = '') {
        const user = this.#users.get(userId) ?? {}
        const existingRoom = this.rooms.has(roomId);

        const updatedUserData = new Attendee({
            ...user,
            ...userData,
            roomId,
            isSpeaker: !existingRoom,
        });

        this.#users.set(userId, updatedUserData);

        return this.#users.get(userId);
    }

    getEvents() {
        const functions = Reflect.ownKeys(RoomsController.prototype)
            .filter(fn => fn !== 'constructor')
            .map(name => [name, this[name].bind(this)]);
        
        return new Map(functions);
    }
}