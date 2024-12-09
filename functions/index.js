const {onRequest} = require("firebase-functions/v2/https");
var express = require('express');

const {addCar} = require("./handlers/cars/addCar");
const {getUserCars} = require("./handlers/cars/getUserCars");
const {updateCar} = require("./handlers/cars/updateCar");

const {signUp} = require("./handlers/auth/signUp");
const {logIn} = require("./handlers/auth/logIn");
const {resetPassword} = require("./handlers/auth/sendResetPassword");

var cars = express();

cars.get("/", (req, res) => res.status(200).send("Hey there!"));
cars.post('/add-car', addCar);
cars.post('/get-user-cars', getUserCars);
cars.post('/update-car', updateCar);


exports.cars = onRequest(cars);

var auth = express();

auth.get("/", (req, res) => res.status(200).send("Hey there!"));

auth.post('/sign-up', signUp);
auth.post('/log-in', logIn);
auth.post('/reset-password', resetPassword);


exports.auth = onRequest(auth);