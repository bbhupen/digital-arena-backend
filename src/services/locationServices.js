const { getAllLocationRecord } = require("../data_access/locationRepo");
const ApiResponse = require("../helpers/apiresponse");

const getAllLocation = async () => {
    const locationRecord = await getAllLocationRecord();
    if (!locationRecord){
        return ApiResponse.response("success", "no_record_found");
    }

    return ApiResponse.response("success", "record_found", locationRecord);

}

module.exports = {
    getAllLocation
};