// Helper functions
exports.serialize = function (message) {
    return new Buffer(JSON.stringify(message));
};

exports.isEmpty = function (obj){
    return (Object.getOwnPropertyNames(obj).length === 0);
}

exports.deserialize = JSON.parse;

exports.isJSONRequest = function (request) {
    return request.headers.accept && request.headers.accept.indexOf("application/json") > -1;
}

exports.isNotifyQuery = function (request) {
    return request.url && request.url.indexOf("/notify") > -1;
}

exports.randomInt = function (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

// Is key in (low, high)
exports.inRange = function (key, low, high) {
    return (low < high && key > low && key < high) ||
        (low > high && (key > low || key < high)) ||
	(low === high && key !== low);
}

// Is key in (low, high]
exports.inHalfOpenRange = function (key, low, high) {
    return (low < high && key > low && key <= high) ||
        (low > high && (key > low || key <= high)) ||
	(low === high);
}

// Key comparison
function less_than(low, high) {
    if (low.length !== high.length) {
        // Arbitrary comparison
        return low.length < high.length;
    }

    for (var i = 0; i < low.length; ++i) {
        if (low[i] < high[i]) {
            return true;
        } else if (low[i] > high[i]) {
            return false;
        }
    }

    return false;
}
exports.less_than = less_than;

exports.less_than_or_equal = function (low, high) {
    if (low.length !== high.length) {
        // Arbitrary comparison
        return low.length <= high.length;
    }

    for (var i = 0; i < low.length; ++i) {
        if (low[i] < high[i]) {
            return true;
        } else if (low[i] > high[i]) {
            return false;
        }
    }

    return true;
}

exports.equal_to = function (a, b) {
    if (a.length !== b.length) {
        return false;
    }

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
}


