const {db} = require("../util/admin");


const getWorkshopInCity = async (req, res) => {
    const city = req.query.city

    const fixesRef = db.collection('companies');
    try {
        fixesRef.where("city", "==", city).get().then((snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                reference: doc.ref.path,
                ...doc.data(),
            }));
            console.log(data);
            return res.status(200).json(data);
        })
    } catch (error) {
        return res
            .status(500)
            .json({general: "Something went wrong, please try again"});
    }
};

module.exports = {getWorkshopInCity};