const {db} = require("../util/admin");
const {onRequest} = require("firebase-functions/v1/https");


exports.getWorkshopClosedFixes = onRequest(async (req, res) => {
    const companyRef = req.query.companyRef

    const fixesRef = db.collection('fixes');
    try {
        fixesRef.where("companyRef", "==", companyRef).where("isClosed", "==", true).get().then((snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                ...doc.data(),
                reference: doc.ref.path,
                date: doc.data().date.toDate().toISOString(),
                bookDate: doc.data().bookDate.toDate().toISOString(),
                // notifications: doc.data().notifications.map(notification => ({
                //     ...notification,
                //     date: notification.date.toDate().toISOString(),
                //     sendDate: notification.sendDate.toDate().toISOString(),
                // }))
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