const {onRequest} = require("firebase-functions/v2/https");

var express = require('express');

var cars = express();

const {addCar} = require("./handlers/cars/addCar");
const {getUserCars} = require("./handlers/cars/getUserCars");
const {updateCar} = require("./handlers/cars/updateCar");


cars.get("/", (req, res) => res.status(200).send("Hey there!"));
cars.post('/add-car', addCar);
cars.post('/get-user-cars', getUserCars);
cars.post('/update-car', updateCar);


exports.cars = onRequest(cars);

var auth = express();

auth.get("/", (req, res) => res.status(200).send("Hey there!"));

exports.auth = onRequest(auth);