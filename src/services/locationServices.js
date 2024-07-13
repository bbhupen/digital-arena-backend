const { getAllLocationRecord } = require("../data_access/locationRepo");
const ApiResponse = require("../helpers/apiresponse");
const resCode = require("../helpers/responseCodes");

const getAllLocation = async () => {
    try {
        const locationRecord = await getAllLocationRecord();
        if (!locationRecord){
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no_record_found");
        }
    
        return ApiResponse.response(resCode.RECORD_FOUND, "success", "record_found", locationRecord);
    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error occurred");
    }
    

}

module.exports = {
    getAllLocation
};