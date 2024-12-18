const {onRequest} = require("firebase-functions/v1/https");
const {db} = require("../util/admin");

exports.updateProfile = onRequest(async (req, res, next) => {
    const name = req.query.name;
    const surname = req.query.surname;
    const phone = req.query.phone;
    const userRef = req.query.reference;


    try {
        const userDocument = await db.doc(userRef).get();

        if (userDocument.exists) {
            await db.doc(userRef).set({
                ...userDocument.data(),
                role: 'user',
                profile: {
                    name: name,
                    surname: surname,
                    phone: phone,
                }
            })
            return res
                .status(200)
                .json({
                    ...userDocument.data(),
                    profile: {
                        name: name,
                        surname: surname,
                        phone: phone,
                    },
                    role: 'user',
                    reference: userRef,
                });
        } else {
            return res
                .status(500)
                .json({general: "Something went wrong, please try again"});
        }

    } catch (error) {
        return res
            .status(500)
            .json({general: "Something went wrong 2, please try again", message: error.message});
    }
})
