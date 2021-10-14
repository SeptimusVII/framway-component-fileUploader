module.exports = function(app){
    var FileUploader = Object.getPrototypeOf(app).FileUploader = new app.Component("fileUploader");
    // FileUploader.debug = true;
    FileUploader.createdAt      = "2.0.0";
    FileUploader.lastUpdate     = "2.0.0";
    FileUploader.version        = "1";
    // FileUploader.factoryExclude = true;
    // FileUploader.loadingMsg     = "This message will display in the console when component will be loaded.";
    // FileUploader.requires       = [];

    // FileUploader.prototype.onCreate = function(){
    // do thing after element's creation
    // }
    return FileUploader;
}