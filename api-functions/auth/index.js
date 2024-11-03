var express = require('express');
var app = express();
const PORT = process.env.PORT || 5050
const {books} = require('./handlers/books')
const {signUp} = require('./handlers/signUp');
const {logIn} = require("./handlers/logIn");

const cors = require("cors");
const {addCompany} = require("./handlers/addCompany");
const {updateProfile} = require("./handlers/updateProfile");
const {resetPassword} = require("./handlers/sendResetPassword");

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
app.post('/reset-password', resetPassword);
app.get('/', (req, res) => {
    res.send('This is my demo project')
})
app.listen(PORT, function () {
    console.log(`Demo project at: ${PORT}!`);
});