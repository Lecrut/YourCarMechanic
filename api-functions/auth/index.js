var express = require('express');
var app = express();
const PORT = process.env.PORT || 5050
const {books} = require('./handlers/books');
const cors = require("cors");
const {signUp} = require('./handlers/signUp');
const {logIn} = require("./handlers/logIn");
const {addCompany} = require("./handlers/addCompany");
const {updateProfile} = require("./handlers/updateProfile");
const {resetPassword} = require("./handlers/sendResetPassword");
const {addCar} = require("./handlers/addCar");
const {getUserCars} = require("./handlers/getUserCars");
const {updateCar} = require("./handlers/updateCar");
const {getUserFixes} = require("./handlers/getUserFixes");
const {getWorkshopFixes} = require("./handlers/getWorkshopFixes");
const {updateOwner} = require("./handlers/updateOwner");
const {addFix} = require("./handlers/addFix");
const {addNotification} = require("./handlers/addNotification");
const {getWorkshopInCity} = require("./handlers/getWorkshopInCity");
const {isFixBooked} = require("./handlers/isFixBooked");
const {getWorkshop} = require("./handlers/getWorkshop");
const {getUserClosedFixes} = require("./handlers/getUserClosedFixes");
const {getWorkshopClosedFixes} = require("./handlers/getWorkshopClosedFixes");
const {updateCompany} = require("./handlers/updateCompany");

const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
}

app.use(cors(corsOptions))

app.get('/books', books);
app.post('/sign-up', signUp);
app.post('/log-in', logIn);
app.post('/add-company', addCompany);
app.post('/update-user', updateProfile);
app.post('/update-company', updateCompany);
app.post('/update-owner', updateOwner);
app.post('/reset-password', resetPassword);
app.post('/add-car', addCar);
app.post('/get-user-cars', getUserCars);
app.post('/update-car', updateCar);
app.post('/get-user-fixes', getUserFixes);
app.post('/get-user-closed-fixes', getUserClosedFixes);
app.post('/get-workshop-fixes', getWorkshopFixes);
app.post('/get-workshop-closed-fixes', getWorkshopClosedFixes);
app.post('/add-fix', addFix);
app.post('/add-notification', addNotification);
app.post('/get-workshop-in-city', getWorkshopInCity);
app.post('/is-fix-booked', isFixBooked);
app.post('/get-workshop', getWorkshop);
app.get('/', (req, res) => {
    res.send('This is my project')
})
app.listen(PORT, function () {
    console.log(`Demo project at: ${PORT}!`);
});