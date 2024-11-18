const {onRequest} = require("firebase-functions/v1/https");
const {db} = require("../util/admin");

exports.updateCar = onRequest(async (req, res, next) => {
    const brand = req.query.manufacturer
    const model = req.query.model
    const productionYear = req.query.productionYear
    const vin = req.query.vin
    const reference = req.query.reference

    try {
        const carRef = db.doc(reference);

        const newCar = await carRef.update({
            manufacturer: brand,
            model: model,
            productionYear: productionYear,
            vin: vin,
        })
        return res
            .status(200)
            .json({
                manufacturer: brand,
                model: model,
                productionYear: productionYear,
                vin: vin,
                reference: newCar.path
            });


    } catch (error) {
        return res
            .status(500)
            .json({general: "Something went wrong, please try again", message: error.message});
    }
})