class ApiResponse{

static response(status_code, status, message, data = {}) {
    return {
        status_code : status_code,
        status : status,
        message : message,
        data: data
    };
}

}

module.exports = ApiResponse;