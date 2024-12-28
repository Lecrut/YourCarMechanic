var express = require('express');
const cors = require("cors");

const PORT = process.env.PORT || 3003;

const {getWorkshop} = require("./handlers/getWorkshop");
const {getWorkshopInCity} = require("./handlers/getWorkshopInCity");
const {isFixBooked} = require("./handlers/isFixBooked");


var app = express();
app.use(cors());
app.use(express.json());

app.post("/", (req, res) => res.status(200).send("Hey there!"));
app.post('/get-workshop', getWorkshop);
app.post('/get-workshop-in-city', getWorkshopInCity);
app.post('/is-fix-booked', isFixBooked);


app.listen(PORT, function () {
    console.log(`Server is running on port ${PORT}`);
});