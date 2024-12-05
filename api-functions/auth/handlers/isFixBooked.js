const {db} = require("../util/admin");
const {onRequest} = require("firebase-functions/v1/https");
const {Timestamp} = require("firebase-admin/firestore");


exports.isFixBooked = onRequest(async (req, res) => {
    const companyRef = req.query.companyRef
    const hour = req.query.hour

    const fixesRef = db.collection('fixes');
    try {
        const isFixExists = await fixesRef
            .where("companyRef", "==", companyRef)
            .where("date", "==", Timestamp.fromDate(new Date(hour)))
            .get();

        if (!isFixExists.empty) {
            return res
                .status(200)
                .json(true);
        } else {
            return res
                .status(200)
                .json(false);
        }
    } catch (error) {
        return res
            .status(500)
            .json({general: "Something went wrong, please try again"});
    }
});