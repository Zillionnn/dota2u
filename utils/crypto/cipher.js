const crypto = require('crypto');


exports.encrypted=function (origin_pwd) {
    const cipher = crypto.createCipher('aes192', '20d6743b93893568a964755201e25c8a');

    console.log(origin_pwd);
    let encrypted = cipher.update(origin_pwd, 'utf8', 'hex');
    encrypted += cipher.final('hex');
   // console.log(encrypted);
    return encrypted;
};



exports.decrypted=function (Ciphertext) {
    const decipher = crypto.createDecipher('aes192', '20d6743b93893568a964755201e25c8a');

    let encrypted =Ciphertext;
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    console.log(decrypted);
    return decrypted;

};