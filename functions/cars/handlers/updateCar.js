const {db} = require("../util/admin");

const updateCar = async (req, res, next) => {
    const car = req.query.car

    if (!car) {
        return res
            .status(400)
            .json({general: "Missing car parameter"});
    }

    try {
        const carData = JSON.parse(decodeURIComponent(car));

        const {
            manufacturer,
            model,
            productionYear,
            vin,
            userRef,
            reference
        } = carData;
        if (!userRef) {
            return res
                .status(400)
                .json({general: "User reference is required"});
        }

        try {
            const carRef = db.doc(reference);

            const newCar = await carRef.update({
                manufacturer: manufacturer,
                model: model,
                productionYear: productionYear,
                vin: vin,
            })
            return res
                .status(200)
                .json({
                    manufacturer: manufacturer,
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

    } catch (e) {
        return res
            .status(500)
            .json({general: "Something went wrong, please try again", message: e.message});
    }
};

module.exports = {updateCar};