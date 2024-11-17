const {onRequest} = require("firebase-functions/v1/https");
const {db} = require("../util/admin");
const {Timestamp} = require("firebase-admin/firestore");

exports.addCar = onRequest(async (req, res, next) => {
    const brand = req.query.manufacturer
    const model = req.query.model
    const productionYear = req.query.productionYear
    const vin = req.query.vin
    const userRef = req.query.userRef

    const isUserExists = await db.doc(userRef)
    if (isUserExists) {
        try {
            const carsRef = db.collection('cars');

            const docRef = await carsRef.add({
                manufacturer: brand,
                model: model,
                productionYear: productionYear,
                vin: vin,
                userRef: userRef,

                createTime: Timestamp.now(),
            });

            return res
                .status(200)
                .json({
                    manufacturer: brand,
                    model: model,
                    productionYear: productionYear,
                    vin: vin,
                    userRef: userRef,
                    reference: docRef.path
                });
        } catch (error) {
            return res
                .status(500)
                .json({general: "Something went wrong, please try again", message: error.message});
        }
    } else {
        return res
            .status(500)
            .json({general: "Something went wrong, please try again"});
    }
});