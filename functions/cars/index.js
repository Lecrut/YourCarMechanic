var express = require('express');
const cors = require("cors");

const PORT = process.env.PORT || 3001;

const {addCar} = require("./handlers/addCar");
const {getUserCars} = require("./handlers/getUserCars");
const {updateCar} = require("./handlers/updateCar");

var app = express();
app.use(cors());
app.use(express.json());

app.post("/", (req, res) => {
    console.log("Received request at /");
    res.send('CARS STORE');
});
app.post('/add-car', addCar);
app.post('/get-user-cars', getUserCars);
app.post('/update-car', updateCar);

app.listen(PORT, function () {
    console.log(`Server is running on port ${PORT}`);
});