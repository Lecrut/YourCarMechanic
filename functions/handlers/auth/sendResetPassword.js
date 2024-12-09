const {sendPasswordResetEmail} = require("firebase/auth");
const {auth} = require("../../util/firebase");


const resetPassword = async (req, res) => {
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
};

module.exports = {resetPassword};