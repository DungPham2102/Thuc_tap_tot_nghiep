# import serial
import asyncio
import websockets
import time

# # Cấu hình
# SERIAL_PORT = '/dev/serial0'
# BAUDRATE = 9600
WEBSOCKET_URI = "ws://localhost:8000"

# Hàm kiểm tra định dạng
def is_valid_data(data_str):
    parts = data_str.split(',')
    if len(parts) != 6:
        return False
    try:
        # Chuyển tất cả thành float để kiểm tra hợp lệ
        [float(p) for p in parts]
        return True
    except ValueError:
        return False

# Hàm đọc serial và gửi nếu hợp lệ
async def read_and_send():
    # ser = serial.Serial(SERIAL_PORT, BAUDRATE, timeout=1)
    # print(f"Đang mở serial {SERIAL_PORT}...")

    async with websockets.connect(WEBSOCKET_URI) as websocket:
        print("Đã kết nối WebSocket")

        await websocket.send("Handshake from client")
        response = await websocket.recv()
        print(f"Server: {response}")

        while True:
            try:
                #line = ser.readline().decode('utf-8', errors='replace').strip()
                line ="21.027763,105.834160,90,180,120,120"
                if line:
                    #if is_valid_data(line):
                        print(f"✅ Định dạng hợp lệ, gửi: {line}")
                        time.sleep(1)
                        await websocket.send(line)
                    #else:
                     #   print(f"⚠️ Bỏ qua dòng sai định dạng: {line}")
            except Exception as e:
                print(f"❌ Lỗi: {e}")
                await asyncio.sleep(1)

# Chạy chương trình
asyncio.run(read_and_send())
