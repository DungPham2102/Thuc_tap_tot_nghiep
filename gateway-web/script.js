// Khởi tạo bản đồ

// @ts-ignore
var map = L.map("map", {
  center: [21.03873701, 105.78245842],
  zoom: 20,
  scrollWheelZoom: false,
  touchZoom: false,
  zoomControl: false,
  dragging: false,
  doubleClickZoom: false,
  boxZoom: false,
  keyboard: false,
});

// Thêm tile layer vào bản đồ

// @ts-ignore
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
  maxZoom: 19,
}).addTo(map);

// Tọa độ ban đầu của thuyền
var center = [21.03873701, 105.78245842];

// Khởi tạo marker cho thuyền

// @ts-ignore
var boatMarker = L.marker(center).addTo(map);

// Tạo radar line (đường radar)

// Tạo một danh sách chứa các đối tượng vòng tròn để có thể xóa và vẽ lại
var circleLayers = [];

// Hàm vẽ lại các vòng tròn xung quanh thuyền
function drawCircles(map, center) {
  // Xóa các vòng tròn cũ nếu có
  circleLayers.forEach((layer) => map.removeLayer(layer));
  circleLayers = []; // Đặt lại mảng lưu các vòng tròn

  var radii = [75, 50, 25];
  radii.forEach((radius) => {
    // @ts-ignore
    var circle = L.circle(center, {
      color: "rgb(131, 222, 70)",
      fillColor: "rgb(43, 75, 37)",
      fillOpacity: 0.4,
      radius: radius,
    }).addTo(map);
    circleLayers.push(circle); // Lưu lại layer để có thể xóa sau này
  });
}

// Vẽ các vòng tròn ban đầu
drawCircles(map, center);

// Hàm xoay và cập nhật đường radar
function rotateLine(angle, center) {
  var radius = 75 / 111000; // Chuyển đổi đơn vị mét thành độ (lat/lon)
  var newLat = center[0] + radius * Math.cos((angle * Math.PI) / 180);
  var newLon = center[1] + radius * Math.sin((angle * Math.PI) / 180);
  return [newLat, newLon];
}

var radarLines = [];
var currentHeadingLine, targetHeadingLine;

// Hàm xoay và tạo radar line mới
function rotateLine(angle, center) {
  var radius = 75 / 111000; // Chuyển đổi đơn vị mét thành độ (lat/lon)
  var newLat = center[0] + radius * Math.cos((angle * Math.PI) / 180);
  var newLon = center[1] + radius * Math.sin((angle * Math.PI) / 180);
  return [newLat, newLon];
}

// Hàm để cập nhật và tạo hiệu ứng radar
function updateRadar(angle) {
  // @ts-ignore
  var currentLat = parseFloat(document.getElementById("current-lat").value);
  // @ts-ignore
  var currentLon = parseFloat(document.getElementById("current-lon").value);
  var center = [currentLat, currentLon];

  var newPosition = rotateLine(angle, center);

  // Tạo một đường radar mới

  // @ts-ignore
  var radarLine = L.polyline([center, newPosition], {
    color: "rgb(136, 244, 60)",
    weight: 2,
    opacity: 1.0,
  }).addTo(map);
  radarLines.push(radarLine);

  // Cập nhật góc của radar và tạo hiệu ứng quay liên tục
  requestAnimationFrame(function () {
    updateRadar((angle + 1) % 360); // Liên tục quay
  });

  // Cập nhật độ mờ dần của các radar line trước đó
  for (var i = 0; i < radarLines.length; i++) {
    var currentOpacity = radarLines[i].options.opacity;
    if (currentOpacity <= 0) {
      map.removeLayer(radarLines[i]); // Xóa đường nếu đã mờ hoàn toàn
      radarLines.splice(i, 1); // Xóa khỏi danh sách
      i--; // Điều chỉnh lại chỉ số
    } else {
      radarLines[i].setStyle({
        opacity: currentOpacity - 0.02,
      }); // Giảm độ mờ
    }
  }

  updateHeadingLines(center);
}

function updateHeadingLines(center) {
  // @ts-ignore
  var currentHead = parseFloat(document.getElementById("current-head").value);
  // @ts-ignore
  var targetHead = parseFloat(document.getElementById("target-head").value);

  var currentHeadingEnd = rotateLine(currentHead, center); // Điểm kết thúc của đường Current Head
  var targetHeadingEnd = rotateLine(targetHead, center); // Điểm kết thúc của đường Target Head

  // Xóa các đường trước đó nếu có
  if (currentHeadingLine) map.removeLayer(currentHeadingLine);
  if (targetHeadingLine) map.removeLayer(targetHeadingLine);

  // Vẽ đường Current Head (vàng)

  // @ts-ignore
  currentHeadingLine = L.polyline([center, currentHeadingEnd], {
    color: "yellow",
    weight: 3,
  }).addTo(map);

  // Vẽ đường Target Head (xanh lá)

  // @ts-ignore
  targetHeadingLine = L.polyline([center, targetHeadingEnd], {
    color: "red",
    weight: 3,
  }).addTo(map);
}
// Hàm cập nhật vị trí thuyền
function updateBoatPosition() {
  // @ts-ignore
  var currentLat = parseFloat(document.getElementById("current-lat").value);
  // @ts-ignore
  var currentLon = parseFloat(document.getElementById("current-lon").value);
  var newCenter = [currentLat, currentLon];

  boatMarker.setLatLng(newCenter); // Cập nhật vị trí của thuyền
  map.panTo(newCenter); // Di chuyển bản đồ theo vị trí mới của thuyền

  // Vẽ lại các vòng tròn khi vị trí thuyền thay đổi
  drawCircles(map, newCenter);
}
let websocket; // Khai báo biến websocket ở cấp toàn cục

// Thiết lập WebSocket kết nối
function setupWebSocket() {
  websocket = new WebSocket("ws://localhost:8000"); // Địa chỉ WebSocket server

  websocket.onopen = () => {
    console.log("WebSocket connection opened");

    // @ts-ignore
    document.getElementById("console").value +=
      "WebSocket connection established!\n";
  };

  websocket.onmessage = (event) => {
    console.log("Received message:", event.data);

    // Xử lý và hiển thị dữ liệu nhận được từ server
    const data = event.data.split(",");
    const currentLatElem = document.getElementById("current-lat");

    // @ts-ignore
    if (currentLatElem) currentLatElem.value = data[0] || "No data";

    // @ts-ignore
    document.getElementById("current-lon").value = data[1] || "No data";

    // @ts-ignore
    document.getElementById("current-head").value = data[2] || "No data";

    // @ts-ignore
    document.getElementById("target-head").value = data[3] || "No data";

    // @ts-ignore
    document.getElementById("left-speed").value = data[4] || "No data";

    // @ts-ignore
    document.getElementById("right-speed").value = data[5] || "No data";

    // @ts-ignore
    document.getElementById("pid").value = data[6] || "No data";

    // Ghi vào console
    appendLog("Data received: " + event.data);
  };

  websocket.onclose = () => {
    console.log("WebSocket connection closed");

    // @ts-ignore
    document.getElementById("console").value += "Connection closed!\n";
  };

  websocket.onerror = (error) => {
    console.error("WebSocket error:", error);

    // @ts-ignore
    document.getElementById("console").value += "Error in connection!\n";
  };
}

// Gọi hàm này khi trang web được load để mở kết nối WebSocket
setupWebSocket();

function appendLog(msg) {
  const consoleElem = document.getElementById("console");

  // @ts-ignore
  const isAtBottom =
    // @ts-ignore
    consoleElem.scrollTop + consoleElem.clientHeight >=
    // @ts-ignore
    consoleElem.scrollHeight - 10;

  // @ts-ignore
  consoleElem.value += msg + "\n";

  // Nếu đang ở cuối log thì mới scroll xuống
  if (isAtBottom) {
    // @ts-ignore
    consoleElem.scrollTop = consoleElem.scrollHeight;
  }
}

function fetchDataFromWebSocket() {
  // Địa chỉ WebSocket server
  websocket.onmessage = (event) => {
    console.log("Received message:", event.data);

    // Dữ liệu nhận từ server là chuỗi giá trị ngăn cách bởi dấu phẩy
    const data = event.data.split(",");

    // Cập nhật các trường với dữ liệu nhận từ server WebSocket

    // @ts-ignore
    document.getElementById("current-lat").value = data[0] || "No data";

    // @ts-ignore
    document.getElementById("current-lon").value = data[1] || "No data";

    // @ts-ignore
    document.getElementById("current-head").value = data[2] || "No data";

    // @ts-ignore
    document.getElementById("target-head").value = data[3] || "No data";

    // @ts-ignore
    document.getElementById("left-speed").value = data[4] || "No data";

    // @ts-ignore
    document.getElementById("right-speed").value = data[5] || "No data";

    // @ts-ignore
    document.getElementById("pid").value = data[6] || "No data";

    // Ghi vào console

    // @ts-ignore
    document.getElementById("console").value +=
      "Data received: " + event.data + "\n";
  };
}

// Gửi dữ liệu khi nhấn nút "Send"
function sendDataToWebSocket() {
  // @ts-ignore
  const mode = document.getElementById("mode").value;

  // @ts-ignore
  const speed = document.getElementById("speed").value;

  // @ts-ignore
  const targetLat = document.getElementById("target-lat").value;

  // @ts-ignore
  const targetLon = document.getElementById("target-lon").value;

  // @ts-ignore
  const kp = document.getElementById("kp").value;

  // @ts-ignore
  const ki = document.getElementById("ki").value;

  // @ts-ignore
  const kd = document.getElementById("kd").value;

  // Tạo chuỗi số cách nhau bằng dấu phẩy
  const dataString = `${mode},${speed},${targetLat},${targetLon},${kp},${ki},${kd}`;
}
setInterval(function () {
  // Lấy dữ liệu mới từ server
  updateBoatPosition();
  // Cập nhật vị trí thuyền
}, 0.00000001);

// Khởi động radar quay

// @ts-ignore
updateRadar(0, 0.6);
