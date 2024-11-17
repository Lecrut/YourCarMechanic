const {db} = require("../util/admin");
const {onRequest} = require("firebase-functions/v1/https");


exports.getUserCars = onRequest(async (req, res) => {
    const userRef = req.query.userRef

    const carsRef = db.collection('cars');
    try {
        carsRef.where("userRef", "==", userRef).get().then((snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                reference: doc.path,
                ...doc.data(),
            }));
            console.log(data);
            return res.status(201).json(data);
        })
    } catch (error) {
        return res
            .status(500)
            .json({general: "Something went wrong, please try again"});
    }
});