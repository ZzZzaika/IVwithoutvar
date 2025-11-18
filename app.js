var mqtt = {
    host: "broker.hivemq.com",
    useSSL: false,
    port: 8000,
    clientId: "clientId-olxghiNm4j",
    username: "",
    topic_prefix: "iot_practice/"
};

var bulb = {
    dimmer: 100,
    on: false,
    is_rgb: false,
    rgb: "#ffcf00"
};

function showBulb() {
    var r, g, b, textColor;
    
    if (bulb.is_rgb) {
        r = bulb.on ? hexToRgb(bulb.rgb).r : 255;
        g = bulb.on ? hexToRgb(bulb.rgb).g : 255;
        b = bulb.on ? hexToRgb(bulb.rgb).b : 255;
        $("#state").text(bulb.on ? rgbToHex(r, g, b) : "off");
        textColor = (299 * r + 587 * g + 114 * b) / 1000 > 128 ? "#000000" : "#ffffff";
        $("#state").css({ color: textColor });
    } else {
        r = bulb.on ? bulb.dimmer : 0;
        g = 255 - Math.round(48 * r / 100);
        b = Math.round(255 - 255 * r / 100);
        $("#state").text(bulb.on ? bulb.dimmer + "%" : "off");
        $("#state").css({ color: "#000000" });
    }
    
    $("#bg").css({ "background-color": rgbToHex(r, g, b) });
}

function getContrastYIQ(hexColor) {
    return (299 * parseInt(hexColor.substr(0, 2), 16) +
            587 * parseInt(hexColor.substr(2, 2), 16) +
            114 * parseInt(hexColor.substr(4, 2), 16)) / 1000 >= 128 ? "black" : "white";
}

function setState(state) {
    console.log("Set state: " + (state ? "on" : "off"));
    bulb.on = state;
    showBulb();
}

function setRGBMode(isRGB) {
    console.log("Set RGB mode: " + (isRGB ? "True" : "False"));
    bulb.is_rgb = isRGB;
    showBulb();
}

function setColor(color) {
    bulb.rgb = color === null ? "#ffcf00" : color;
    console.log("Set color: " + bulb.rgb);
    showBulb();
}

function setDimmer(value) {
    console.log("Set dimmer: " + value);
    bulb.dimmer = value;
    showBulb();
}

function componentToHex(value) {
    var hex = value.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}

function rgbColor(color) {
    return hexToRgb(color) || rgbaToHex(color) || null;
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function rgbaToHex(rgba) {
    var match = rgba.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    return match && match.length === 4 ?
        "#" + ("0" + parseInt(match[1], 10).toString(16)).slice(-2) +
              ("0" + parseInt(match[2], 10).toString(16)).slice(-2) +
              ("0" + parseInt(match[3], 10).toString(16)).slice(-2)
        : null;
}

function onError() {
    console.warn("Connection error!");
}

function onConnected() {
    console.log("Connected");
    Client.subscribe(mqtt.topic_prefix + mqtt.clientId + "/lamp/#");
    
    Client.publish(mqtt.topic_prefix + mqtt.clientId + "/lamp/init", JSON.stringify({
        on: bulb.on,
        is_rgb: bulb.is_rgb,
        dimmer: bulb.dimmer,
        rgb: bulb.rgb
    }));
}

function onConnectionLost(responseObject) {
    console.warn("Disconnected!", responseObject.errorCode);
}

function onMessageArrived(message) {
    try {
        var payload = message.payloadString.trim().toLowerCase();
        var topicParts = message.topic.split("/");
        
        switch (topicParts[topicParts.length - 1].trim()) {
            case "lamp":
                switch (payload) {
                    case "on":
                        setState(true);
                        break;
                    case "off":
                        setState(false);
                        break;
                    default:
                        console.error("Unknown command '" + message.payloadString + "'");
                }
                break;

            case "mode":
                switch (payload) {
                    case "rgb":
                    case "true":
                        setRGBMode(true);
                        break;
                    case "dimmer":
                    case "false":
                        setRGBMode(false);
                        break;
                    default:
                        console.error("Unknown command '" + message.payloadString + "'");
                }
                break;

            case "init":
                showBulb();
                break;

            case "value":
                var dimmerValue = parseInt(payload, 10);
                if (Number.isNaN(dimmerValue)) {
                    console.error("Unknown dimmer value '" + message.payloadString + "'");
                } else if (dimmerValue < 0 || dimmerValue > 100) {
                    console.error("Out of range for dimmer value '" + dimmerValue + "'");
                } else {
                    setDimmer(dimmerValue);
                }
                break;

            case "color":
                setColor(rgbColor(payload));
                break;
        }
        
    } catch (error) {
        console.error(error);
    }
}

function connect(hostname) {
    var serverHost = hostname === undefined ? mqtt.host : hostname;
    
    console.log("Connecting to " + serverHost);
    
    Client = new Paho.MQTT.Client(serverHost, mqtt.port, mqtt.clientId);
    
    Client.onConnectionLost = onConnectionLost;
    Client.onMessageArrived = onMessageArrived;

    Client.connect({
        useSSL: mqtt.useSSL,
        userName: mqtt.username,
        onSuccess: onConnected,
        onFailure: onError
    });
}

var Client;
$(document).ready(function() {
    connect();
});

