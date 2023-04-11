const express = require("express");
const app = express();
const { Server } = require("socket.io");
const { createServer } = require("http");
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });
const cors = require("cors");
const path = require("path");

const Gpio = require("pigpio").Gpio;

const SENSORS = [4, 27, 22, 5, 6, 13, 26, 12, 25, 24];
const DATA = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

const PORT = 3001;

app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
	req.io = io;
	next();
});


const registerSensors = SENSORS.map(pin => new Gpio(pin , {mode: Gpio.INPUT, alert: true}));

app.get("/", (req,res) => {
	registerSensors.forEach((sensor, index) => {
 			sensor.on("alert", (level) => {
    			DATA[index] = level;
    			//console.log(`IR SENSOR ${index + 1} value: ${level}`);
   			console.log(DATA);
			if(level === 1){
				req.io.emit("alert", index + 1);
			}
			const all0 = DATA.every(pin => pin === 0)
			if(all0){
				req.io.emit("alert", "none");
			}
  		});
	});
	req.io.emit("alert", "none");
	res.sendFile( path.resolve('public', 'index.html') );
});


app.get("/file/:filename", async (req, res) => {
	const { filename } = req.params;
	const file = path.join(__dirname, "public/videos", filename);
	res.sendFile(file);
});


io.on("connection", (socket) => {
	console.log("a user connected:", socket.id);

	socket.on("disconnect", () => {
		console.log("user disconnected");
	});
});

httpServer.listen(PORT, () => {
	console.log(`Server started on port http://localhost:${PORT}`);
});
