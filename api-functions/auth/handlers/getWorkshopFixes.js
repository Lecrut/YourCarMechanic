const {db} = require("../util/admin");
const {onRequest} = require("firebase-functions/v1/https");


exports.getWorkshopFixes = onRequest(async (req, res) => {
    const companyRef = req.query.companyRef

    const fixesRef = db.collection('fixes');
    try {
        fixesRef.where("companyRef", "==", companyRef).get().then((snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                ...doc.data(),
                reference: doc.ref.path,
                date: doc.data().date.toDate().toISOString(),
                bookDate: doc.data().bookDate.toDate().toISOString(),
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