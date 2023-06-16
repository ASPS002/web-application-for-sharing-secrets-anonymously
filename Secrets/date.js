
// console.log(module);

// we have removed getDate() from app.js and stored it in a separate file and then exported it , In this way it makes code much cleaner
function getDate() {
    const options = {

        day: "numeric",
        weekday: "long",
        month: "long",
        year: "numeric"

    }
    const today = new Date();
    return today.toLocaleDateString("en-US", options);//passing options formats the date in a format specified in the options object;
  
}

var getDay = function() {
    const options = {

        day: "numeric",

    }
    const today = new Date();
    return today.toLocaleDateString("en-US", options);//passing options formats the date in a format specified in the options object;
  
}


module.exports.getDate = getDate;
module.exports.getDay = getDay;