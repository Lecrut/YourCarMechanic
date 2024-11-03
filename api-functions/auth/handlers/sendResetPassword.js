const {onRequest} = require("firebase-functions/v1/https");
const {sendPasswordResetEmail} = require("firebase/auth");
const {auth} = require("../util/firebase");


exports.resetPassword = onRequest(async (req, res, next) => {
    const email = req.query.email

    try {
        await sendPasswordResetEmail(auth, email);

        return res
            .status(200)
            .json({general: "ok"});

    } catch (e) {
        return res
            .status(500)
            .json({general: "Something went wrong, please try again", message: e.message});
    }
});