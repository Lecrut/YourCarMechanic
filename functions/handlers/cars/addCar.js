const {db} = require("../../util/admin");
const {Timestamp} = require("firebase-admin/firestore");

const addCar = async (req, res, next) => {
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
            userRef
        } = carData;
        if (!userRef) {
            return res
                .status(400)
                .json({general: "User reference is required"});
        }

        const isUserExists = await db.doc(userRef).get();
        if (isUserExists) {
            try {
                const carsRef = db.collection('cars');

                const docRef = await carsRef.add({
                    manufacturer: manufacturer,
                    model: model,
                    productionYear: productionYear,
                    vin: vin,
                    userRef: userRef,

                    createTime: Timestamp.now(),
                });

                return res
                    .status(200)
                    .json({
                        manufacturer: manufacturer,
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

    } catch (e) {
        return res
            .status(500)
            .json({general: "Something went wrong, please try again", message: e.message});
    }
};

module.exports = {addCar};