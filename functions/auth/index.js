var express = require('express');
const cors = require("cors");

const PORT = process.env.PORT || 3005;

const {signUp} = require('./handlers/signUp');
const {logIn} = require("./handlers/logIn");
const {addCompany} = require("./handlers/addCompany");
const {updateProfile} = require("./handlers/updateProfile");
const {resetPassword} = require("./handlers/sendResetPassword");
const {updateOwner} = require("./handlers/updateOwner");
const {getWorkshop} = require("./handlers/getWorkshop");
const {updateCompany} = require("./handlers/updateCompany");

var app = express();
app.use(cors());
app.use(express.json());

app.post("/", (req, res) => res.status(200).send("Hey there!"));

app.post('/log-in', logIn);
app.post('/sign-up', signUp);
app.post('/add-company', addCompany);
app.post('/update-user', updateProfile);
app.post('/update-company', updateCompany);
app.post('/update-owner', updateOwner);
app.post('/reset-password', resetPassword);
app.post('/get-workshop', getWorkshop);

app.listen(PORT, function () {
    console.log(`Server is running on port ${PORT}`);
});