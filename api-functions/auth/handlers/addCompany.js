const {onRequest} = require("firebase-functions/v1/https");
const {Timestamp} = require("firebase-admin/firestore");
const {db} = require("../util/admin");

exports.addCompany = onRequest(async (req, res, next) => {
    const newCompany = req.query.company;

    if (!newCompany) {
        return res
            .status(400)
            .json({general: "Missing company parameter"});
    }
    try {
        const {
            name,
            nip,
            closingTime,
            openingTime,
            city,
            services,
            phone,
            address,
        } = newCompany;


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

                return res.status(200).json({
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
                    .json({
                        general: "Something went wrong, please try again",
                        message: error.message
                    });
            }
        } else {
            return res
                .status(500)
                .json({general: "Company already exists"});
        }
    } catch (e) {
        return res
            .status(500)
            .json({general: "Something went wrong, please try again", message: e.message});
    }

});
