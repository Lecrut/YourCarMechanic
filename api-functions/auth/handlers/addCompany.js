const {onRequest} = require("firebase-functions/v1/https");
const {Timestamp} = require("firebase-admin/firestore");
const {db} = require("../util/admin");


exports.addCompany = onRequest(async (req, res, next) => {
    const name = req.query.name
    const nip = req.query.nip
    const closingTime = req.query.closingTime
    const openingTime = req.query.openingTime
    const city = req.query.city
    const services = req.query.services
    const phone = req.query.phone
    const address = req.query.address

    const userRef = req.query.reference;

    const companiesRef = db.collection('companies');

    const isCompanyExists = await companiesRef.where("nip", '==', nip).get();

    if (isCompanyExists.empty) {
        try {
            const docRef = await companiesRef.add({
                name: name,
                nip: nip,
                closingTime: closingTime,
                openingTime: openingTime,
                city: city,
                services: services,
                phone: phone,
                address: address,
                createTime: Timestamp.now(),
            });

            const userDocument = await db.doc(userRef);
            userDocument.update({
                company: docRef.path
            })

            return res
                .status(200)
                .json({
                    name: name,
                    nip: nip,
                    closingTime: closingTime,
                    openingTime: openingTime,
                    city: city,
                    services: services,
                    phone: phone,
                    address: address,
                    reference: docRef.path
                });
        } catch (error) {
            return res
                .status(500)
                .json({general: "Something went wrong, please try again", message: error.message});
        }
    } else {
        return res
            .status(500)
            .json({general: "Something went wrong, please try again"});
    }

});
