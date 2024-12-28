const {db} = require("../util/admin");

const updateCompany = async (req, res, next) => {
    const newCompany = req.query.company;

    if (!newCompany) {
        return res
            .status(400)
            .json({general: "Missing company parameter"});
    }
    try {
        const companyData = JSON.parse(decodeURIComponent(newCompany));

        const {
            name,
            nip,
            closingTime,
            openingTime,
            city,
            services,
            phone,
            address,
            reference,
        } = companyData;

        try {
            const companyRef = db.doc(reference);

            const docRef = await companyRef.update({
                name: name,
                closingTime: closingTime,
                openingTime: openingTime,
                city: city,
                services: services,
                phone: phone,
                address: address,
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

    } catch (e) {
        return res
            .status(500)
            .json({general: "Something went wrong, please try again", message: e.message});
    }

};

module.exports = {updateCompany};