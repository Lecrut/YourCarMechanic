const {signInWithEmailAndPassword} = require("firebase/auth");
const {auth} = require("../../util/firebase");
const {db} = require("../../util/admin");

const logIn = async (req, res, next) => {
    const email = req.query.email;
    const password = req.query.password;

    try {
        await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
        console.log('error', error.message)
        return res
            .status(500)
            .json({general: "Something went wrong, please try again", message: error.message});
    }

    const usersRef = db.collection('users');

    try {
        usersRef.where("email", "==", email).get().then((querySnapshot) => {
            const data = querySnapshot.docs.map((doc) => ({
                reference: 'users/' + doc.id,
                ...doc.data(),
            }));
            return res.status(200).json({...data[0]});
        })

    } catch (error) {
        console.log('error', error)
        return res
            .status(500)
            .json({general: "Something went wrong, please try again", message: error.message});
    }

};

module.exports = {logIn};