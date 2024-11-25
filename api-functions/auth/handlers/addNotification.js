const {onRequest} = require("firebase-functions/v1/https");
const {db} = require("../util/admin");
const {FieldValue} = require("firebase-admin/firestore");

exports.addNotification = onRequest(async (req, res, next) => {
    const notification = req.query.notification
    const fixRef = req.query.fix

    if (!fixRef || !notification)
        return res
            .status(400)
            .json({general: "Missing parameters"});

    try {
        const notificationData = JSON.parse(decodeURIComponent(notification));

        const {
            sendDate,
            notificationType,
            cost,
            date,
        } = notificationData;

        const isFixExists = await db.doc(fixRef).get();
        if (isFixExists) {
            db.doc(fixRef).update({
                notification: FieldValue.arrayUnion({
                    sendDate: sendDate,
                    notificationType: notificationType,
                    cost: cost,
                    date: date,
                })
            })

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
})