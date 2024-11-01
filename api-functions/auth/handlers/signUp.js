const {onRequest} = require("firebase-functions/v1/https");
const {db} = require("../util/admin");
const {auth} = require("../util/firebase");
const {Timestamp} = require("firebase-admin/firestore")
const {createUserWithEmailAndPassword, sendEmailVerification} = require("firebase/auth");

exports.signUp = onRequest(async (req, res, next) => {
        const email = req.query.email;
        const password = req.query.password;

        try {
            await createUserWithEmailAndPassword(auth, email, password)
            await sendEmailVerification(auth.currentUser)
        } catch (error) {
            return res
                .status(500)
                .json({general: "Something went wrong, please try again", message: error.message});
        }


        const usersRef = db.collection('users');

        try {
            const docRef = await usersRef.add({
                email: email,
                
                registerTime: Timestamp.now(),
            })
            return res
                .status(200)
                .json({email: email, reference: docRef.path})
        } catch (error) {
            console.log('error', error.message)
            return res
                .status(500)
                .json({general: "Something went wrong, please try again", message: error.message});
        }


        // return res.status(200).json({
        //     message: "Success",
        // });
    }
);
