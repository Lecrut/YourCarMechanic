const {db} = require("../util/admin");
const {FieldValue} = require("firebase-admin/firestore");

const addNotification = async (req, res, next) => {
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
            description,
            date,
        } = notificationData;

        const isLastNotification = Boolean(notificationType === 'giveBackCar' || notificationType === 'workshopCancel' || notificationType === 'userCancel')

        const isFixExists = await db.doc(fixRef).get();
        if (isFixExists) {
            await db.doc(fixRef).update({
                isClosed: isLastNotification,
                notifications: FieldValue.arrayUnion({
                    sendDate: sendDate,
                    notificationType: notificationType,
                    cost: cost,
                    description: description,
                    date: date,
                })
            })

            const data = await db.doc(fixRef).get();

            return res.status(201).json({
                ...data.data(),
                reference: data.ref.path,
                date: data.data().date.toDate().toISOString(),
                bookDate: data.data().bookDate.toDate().toISOString(),
                // notifications: data.data().notifications.map(notification => ({
                //     ...notification,
                //     date: notification.date.toDate().toISOString(),
                //     sendDate: notification.sendDate.toDate().toISOString(),
                // }))
            });

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

module.exports = {addNotification};