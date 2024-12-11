const {onRequest} = require("firebase-functions/v1/https");
const {db} = require("../util/admin");

exports.getWorkshop = onRequest(async (req, res, next) => {
    const workshopRef = req.query.workshop;

    if (!workshopRef)
        return res
            .status(400)
            .json({general: "Missing parameters"});

    try {
        const data = await db.doc(workshopRef).get();

        return res.status(201).json({
            ...data.data(),
            reference: data.ref.path,
        });

    } catch (e) {
        return res
            .status(500)
            .json({general: "Something went wrong, please try again", message: e.message});
    }
});