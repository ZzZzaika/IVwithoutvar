import paho.mqtt.client as mqtt
import sqlite3

conn = sqlite3.connect('lamp_data.db')
c = conn.cursor()

c.execute('''
CREATE TABLE IF NOT EXISTS lamp_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    state TEXT,
    brightness INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)
''')
conn.commit()

def on_message(client, userdata, message):
    topic = message.topic
    payload = message.payload.decode()

    if topic == "iot_practice/5404/lamp":
        state = payload
        print(f"Received lamp state: {state}")
        c.execute("INSERT INTO lamp_status (state) VALUES (?)", (state,))

    elif topic == "iot_practice/5404/lamp/value":
        brightness = payload
        print(f"Received lamp brightness: {brightness}")
        c.execute("UPDATE lamp_status SET brightness = ? WHERE id = (SELECT MAX(id) FROM lamp_status)", (brightness,))

    conn.commit()

client = mqtt.Client()
client.on_message = on_message

client.connect("broker.hivemq.com", 1883, 60)


client.subscribe("iot_practice/5404/lamp")
client.subscribe("iot_practice/5404/lamp/value")


client.loop_forever()
