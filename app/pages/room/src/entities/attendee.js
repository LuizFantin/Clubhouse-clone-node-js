export default class Attendee {
    constructor({ id, username, img, isSpeaker, roomId, peerId}) {
        this.id = id;      
        this.img = img || "";      
        this.isSpeaker = isSpeaker;      
        this.roomId = roomId;      
        this.peerId = peerId;
        
        this.username = username || "Usuário Anônimo";      
        const [firstName, lastName] = this.username.split(/\s/);
        this.firstName = firstName;
        this.lastName = lastName;
    }
}