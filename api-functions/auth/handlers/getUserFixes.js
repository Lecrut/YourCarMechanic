const {db} = require("../util/admin");
const {onRequest} = require("firebase-functions/v1/https");


exports.getUserFixes = onRequest(async (req, res) => {
    const userRef = req.query.userRef

    const fixesRef = db.collection('fixes');
    try {
        fixesRef.where("userRef", "==", userRef).get().then((snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                reference: doc.ref.path,
                ...doc.data(),
            }));
            console.log(data);
            return res.status(200).json(data);
        })
    } catch (error) {
        return res
            .status(500)
            .json({general: "Something went wrong, please try again"});
    }
});