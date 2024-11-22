const {db} = require("../util/admin");
const {onRequest} = require("firebase-functions/v1/https");


exports.getWorkshopFixes = onRequest(async (req, res) => {
    const companyRef = req.query.companyRef

    const fixesRef = db.collection('fixes');
    try {
        fixesRef.where("companyRef", "==", companyRef).get().then((snapshot) => {
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