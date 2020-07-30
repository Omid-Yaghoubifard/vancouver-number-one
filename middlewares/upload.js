const multer = require("multer");

const Storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, "./public/images");
    },
    filename: function(req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
});

const upload = multer({
    storage: Storage,
    fileFilter: function(req, file, callback) {
        let extname = file.originalname.toLowerCase().match(/.(jpeg|jpg|png|gif|gif|tif|tiff)$/);
        let mimetype = file.mimetype.match(/(jpeg|jpg|png|gif|gif|tif|tiff)$/);
        if(mimetype && extname) callback(null,true);
        else callback(new multer.MulterError ("Error: Images Only"));
    },
    limits: {fileSize: 750000},
});

module.exports = upload;