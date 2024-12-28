const {db} = require("../util/admin");

const updateOwner = async (req, res, next) => {
    const userRef = req.query.user;
    const companyRef = req.query.company


    try {
        const userDocument = await db.doc(userRef).get();
        const companyDocument = await db.doc(companyRef).get();

        if (userDocument.exists && companyDocument.exists) {
            await db.doc(userRef).set({
                ...userDocument.data(),
                role: 'workshop',
                companyRef: companyRef,
            });
            return res
                .status(200)
                .json({
                    ...userDocument.data(),
                    role: 'workshop',
                    companyRef: companyRef,
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
};

module.exports = {updateOwner};