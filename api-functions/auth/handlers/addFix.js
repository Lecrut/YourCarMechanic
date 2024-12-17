const {onRequest} = require("firebase-functions/v1/https");
const {Timestamp} = require("firebase-admin/firestore");
const {db} = require("../util/admin");

exports.addFix = onRequest(async (req, res, next) => {
    const fixParam = req.query.fix;

    if (!fixParam) {
        return res
            .status(400)
            .json({general: "Missing fix parameter"});
    }

    try {
        const fixData = JSON.parse(decodeURIComponent(fixParam));

        const {
            date,
            bookDate,
            companyRef,
            car,
            carMillage,
            userRef,
            services,
            description,
            clientPhone,
            notifications,
            isClosed,
        } = fixData;

        if (!userRef) {
            return res
                .status(400)
                .json({general: "User reference is required"});
        }
        const isCompanyExists = await db.doc(companyRef).get();
        const isUserExists = await db.doc(userRef).get();

        if (isUserExists.exists && isCompanyExists.exists) {
            try {
                const fixesRef = db.collection('fixes');

                const docRef = await fixesRef.add({
                    date: Timestamp.fromDate(new Date(date)),
                    bookDate: Timestamp.fromDate(new Date(bookDate)),
                    companyRef: companyRef,
                    car: car,
                    carMillage: carMillage,
                    userRef: userRef,
                    services: services,
                    description: description,
                    clientPhone: clientPhone,
                    notifications: notifications,
                    createTime: Timestamp.now(),
                    isClosed: isClosed,
                });

                return res
                    .status(200)
                    .json({
                        date: date,
                        bookDate: bookDate,
                        companyRef: companyRef,
                        car: car,
                        carMillage: carMillage,
                        userRef: userRef,
                        services: services,
                        description: description,
                        clientPhone: clientPhone,
                        notifications: notifications,
                        isClosed: isClosed,
                        reference: docRef.path
                    });
            } catch (error) {
                return res
                    .status(500)
                    .json({
                        general: "Something went wrong, please try again",
                        message: error.message
                    });
            }
        } else {
            return res
                .status(500)
                .json({general: "User not found"});
        }
    } catch (e) {
        return res
            .status(400)
            .json({
                general: "Invalid fix parameter",
                message: e.message
            });
    }
});
