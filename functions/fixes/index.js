var express = require('express');
const cors = require("cors");

const PORT = process.env.PORT || 3002;

const {getWorkshopFixes} = require("./handlers/getWorkshopFixes");
const {getUserFixes} = require("./handlers/getUserFixes");
const {addFix} = require("./handlers/addFix");
const {addNotification} = require("./handlers/addNotification");
const {getUserClosedFixes} = require("./handlers/getUserClosedFixes");
const {getWorkshopClosedFixes} = require("./handlers/getWorkshopClosedFixes");


var app = express();
app.use(cors());
app.use(express.json());

app.post("/", (req, res) => res.status(200).send("Hey there!"));
app.post('/get-workshop-fixes', getWorkshopFixes);
app.post('/get-user-fixes', getUserFixes);
app.post('/add-fix', addFix);
app.post('/add-notification', addNotification);
app.post('/get-user-closed-fixes', getUserClosedFixes);
app.post('/get-workshop-closed-fixes', getWorkshopClosedFixes);


app.listen(PORT, function () {
    console.log(`Server is running on port ${PORT}`);
});