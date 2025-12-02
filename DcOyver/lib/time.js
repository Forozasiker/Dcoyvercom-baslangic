// moment ve moment-timezone'ı güvenli şekilde yükle
let moment;
try {
  moment = require('moment');
  require("moment-timezone");
} catch (error) {
  console.error('❌ moment veya moment-timezone yüklenemedi:', error.message);
  console.error('❌ Hata detayı:', error);
  // Fallback: moment olmadan devam etmeye çalış
  try {
    moment = require('moment');
  } catch (momentError) {
    console.error('❌ moment bile yüklenemedi:', momentError.message);
    throw new Error('moment paketi yüklenemedi. npm install moment moment-timezone komutunu çalıştırın.');
  }
}

const months = { 
    "01": "Ocak", "02": "Subat", "03": "Mart", "04": "Nisan", 
    "05": "Mayis", "06": "Haziran", "07": "Temmuz", "08": "Agustos", 
    "09": "Eylul", "10": "Ekim", "11": "Kasim", "12": "Aralik" 
};

global.months = months;

const formatDate = global.formatDate = function(date) {
    let formatted = moment(date).tz("Europe/Istanbul").format("DD") + " " + 
                    global.months[moment(date).tz("Europe/Istanbul").format("MM")] + " " + 
                    moment(date).tz("Europe/Istanbul").format("YYYY HH:mm")   
    return formatted;
};
