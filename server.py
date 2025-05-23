import asyncio
import websockets

connected_clients = set()
latest_data = ""
last_latitude = None
last_longitude = None

async def handler(websocket, path):
    global latest_data, last_latitude, last_longitude
    connected_clients.add(websocket)
    print(f"New connection: {id(websocket)}")

    try:
        async for message in websocket:
            if message == "Handshake from client":
                await websocket.send("Handshake confirmed")
                print(f"Handshake completed with client: {id(websocket)}")
                continue

            print(f"Received data from client {id(websocket)}: {message}")
            parts = message.strip().split(',')

            if len(parts) != 6:
                print("⚠️  Dữ liệu không hợp lệ, bỏ qua.")
                continue

            try:
                latitude = float(parts[0])
                longitude = float(parts[1])
                current_head = parts[2]
                target_head = parts[3]
                left_speed = parts[4]
                right_speed = parts[5]

                if last_latitude is not None and abs(latitude - last_latitude) > 0.5:
                    print(f"⚠️  Vĩ độ lệch > 0.5, giữ giá trị cũ: {last_latitude}")
                    latitude = last_latitude

                if last_longitude is not None and abs(longitude - last_longitude) > 0.5:
                    print(f"⚠️  Kinh độ lệch > 0.5, giữ giá trị cũ: {last_longitude}")
                    longitude = last_longitude

                last_latitude = latitude
                last_longitude = longitude

                latest_data = f"{latitude},{longitude},{current_head},{target_head},{left_speed},{right_speed}"

                await broadcast_data(websocket)

            except ValueError:
                print("⚠️  Dữ liệu không thể ép kiểu float, bỏ qua.")
                continue

    except websockets.exceptions.ConnectionClosed:
        print(f"Connection {id(websocket)} has disconnected")
    finally:
        connected_clients.remove(websocket)

async def broadcast_data(sender):
    for client in connected_clients:
        if client != sender:
            try:
                await client.send(latest_data)
            except:
                pass

async def main():
    print("WebSocket server is running on port 8000")
    async with websockets.serve(handler, "0.0.0.0", 8000):
        await asyncio.Future()  # run forever

asyncio.run(main())
