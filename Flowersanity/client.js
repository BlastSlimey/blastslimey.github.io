import {Client} from "./archipelago.js";

var reconnecttimer = null;
var disconnecttimeout = 10;
var dontconnectagain = false;
var connectionInfo = null
var client = new Client();
var triedlogin = false;
var connectionUI = document.getElementById("connectionUI");
var playerInput = document.getElementById("playerInput");
var addressInput = document.getElementById("addressInput");
var passwordInput = document.getElementById("passwordInput");
var connectButton = document.getElementById("connectButton");
let connectedonce = false;
let showconnectionstatus = false;
var lastindex = 0;
var progressionItemsReceivedList = [];

function login() {
    triedlogin = true
    if (!offline) {
        connectionInfo = {
            hostport: addressInput.value,
            game: "Flowersanity",
            name: playerInput.value,
            password: passwordInput.value,
            items_handling: 0b111,
        };
        connectToServer();
    }
}

function clearTimeoutFull(timer) {
    if (timer != null) {
        clearTimeout(timer)
    }
    return null
}

function connectionOK() {
    connectedonce = true;
    if (showconnectionstatus) {
        showconnectionstatus = false
    }
    reconnecttimer = clearTimeoutFull(reconnecttimer);
}

function connectionReconnect() {
    reconnecttimer = clearTimeoutFull(reconnecttimer);
    connectToServer(); // a new timer will be started in connectToServer if unsuccesful
}

function checkConnection() {
    console.log("You are disconnected, automatically reconnecting in 10 seconds.")
    reconnecttimer = setTimeout(function () {
        connectionReconnect();
    }, 10000);
}

function newItems(items_in, index_in) {

    if (items_in.length) {

        if (index_in > lastindex) {
            console.log("Something strange happened, you should have received more items already... Let's reconnect...");
            connectionReconnect();
        }
        var items = [];
        for (let i = lastindex - index_in; i < items_in.length; i++) {
            const item = items_in[i];
            progressionItemsReceivedList.push(item.id);
            const itemName = item.toString();
            items.push(itemName);
        }
        lastindex = index_in + items_in.length;

    } else {
        console.log("No items received in this update...");
    }
}

function connectToServer() {
    console.log("Connection to server")
    reconnecttimer = clearTimeoutFull(reconnecttimer);
    console.log(connectionInfo)
    client = new Client();

    window.addEventListener("beforeunload", () => {
        client.socket.disconnect();
    });

    const connectedListener = (packet) => {
        console.log("Connected to server: ", packet);
        packetTeamName = packet.team
        packetSlotName = packet.slot

        checkWin();
        
        console.log("_read_client_status_"+packetTeamName+"_"+packetSlotName)
        
        nextgoal = 0;
    };

    const disconnectedListener = (packet) => {
        console.log("DISCONNECTED!");
        checkConnection();
    }
    
    const receiveditemsListener = (items, index) => {
        connectionOK();
        newItems(items, index);
    };

    client.socket.on("connected", connectedListener);
    client.socket.on("disconnected", disconnectedListener);
    client.items.on("itemsReceived", receiveditemsListener);

    client
        .login(connectionInfo.hostport, connectionInfo.name, connectionInfo.game, {password: connectionInfo.password})
        .then(() => {
            connectionOK();
            document.getElementById("connectionUI").style.display = "none";
        })
        .catch((error) => {
            console.log("Failed to connect", error)
            if (!connectedonce || error[0] == "InvalidSlot" || error[0] == "InvalidGame" || dontconnectagain) {
                dontconnectagain = true;
            } else {
                disconnecttimeout = disconnecttimeout + 1;
                disconnectedtimer = clearTimeoutFull(disconnectedtimer);
            }
        });

}

