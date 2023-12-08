require("regenerator-runtime/runtime");
module.exports = function(app){
    var FileUploader = Object.getPrototypeOf(app).FileUploader = new app.Component("fileUploader");
    // FileUploader.debug = true;
    FileUploader.createdAt      = "2.0.0";
    FileUploader.lastUpdate     = "2.4.3";
    FileUploader.version        = "1.1.4";
    // FileUploader.factoryExclude = true;
    // FileUploader.loadingMsg     = "This message will display in the console when component will be loaded.";
    // FileUploader.requires       = [];

    FileUploader.iconsFiles = {
        'pdf': 'pdf',
        'docx': 'word',
        'xlsx': 'excel',
        'csv': 'csv',
        'pptx': 'powerpoint',
    }

    FileUploader.prototype.onCreate = function(){
        var fileUploader = this;
        fileUploader.id             = (fileUploader.id !== undefined)             ? fileUploader.id              : (fileUploader.$el.attr('id') ? fileUploader.$el.attr('id') : 'fileUploader--'+utils.uniqid());
        fileUploader.mode           = (fileUploader.mode !== undefined)           ? fileUploader.mode            : fileUploader.getData('mode', 'b64');
        fileUploader.maxSize        = (fileUploader.maxSize !== undefined)        ? fileUploader.maxSize         : fileUploader.getData('maxsize', false);
        fileUploader.classLabel     = (fileUploader.classLabel !== undefined)     ? fileUploader.classLabel      : fileUploader.getData('classlabel', '');
        fileUploader.classWrapper   = (fileUploader.classWrapper !== undefined)   ? fileUploader.classWrapper    : fileUploader.getData('classwrapper', '');
        fileUploader.files          = (fileUploader.files !== undefined)          ? fileUploader.files           : [...new Set(fileUploader.getData('files', '').split(','))];
        fileUploader.allowed        = (fileUploader.allowed !== undefined)        ? fileUploader.allowed         : [...new Set(fileUploader.getData('allowed', '').replace(/\./g,'').trim().split(','))];
        fileUploader.multiple       = (fileUploader.multiple !== undefined)       ? fileUploader.multiple        : (parseInt(fileUploader.getData('maxfiles', 0)) !== 1 ? (fileUploader.$el.attr('multiple') !== undefined ? true : false) : false);
        fileUploader.maxFiles       = (fileUploader.maxFiles !== undefined)       ? fileUploader.maxFiles        : (fileUploader.multiple !== false ? parseInt(fileUploader.getData('maxfiles', 0)) : '1');
        fileUploader.dataAttr       = (fileUploader.dataAttr !== undefined)       ? fileUploader.dataAttr        : (fileUploader.getData('wizardkey',false) ? 'data-wizardkey':'name');
        fileUploader.name           = (fileUploader.name !== undefined)           ? fileUploader.name            : (fileUploader.multiple ? fileUploader.$el.attr(fileUploader.dataAttr)+'[]' : fileUploader.$el.attr(fileUploader.dataAttr));
        fileUploader.nbPreviewItems = (fileUploader.nbPreviewItems !== undefined) ? fileUploader.nbPreviewItems  : fileUploader.getData('nbpreviewitems', false);
        fileUploader.helper         = (fileUploader.helper !== undefined)         ? fileUploader.helper          : fileUploader.getData('helper', false);

        // callbacks
        fileUploader.onFileAdded    = (window[fileUploader.getData('onfileadded')] !== undefined)   ? window[fileUploader.getData('onfileadded')]   : function(file){ fileUploader.log('onFileAdded',file); };
        fileUploader.onFileDeleted  = (window[fileUploader.getData('onfiledeleted')] !== undefined) ? window[fileUploader.getData('onfiledeleted')] : function(file){ fileUploader.log('onfiledeleted',file); };

        fileUploader.$el.attr('id',fileUploader.id);
        fileUploader.$el.attr('data-name',fileUploader.name);
        fileUploader.$el.addClass('fileUploader').wrap('<div class="fileUploader__wrapper '+fileUploader.classWrapper+'"></div>');
        if (fileUploader.multiple === false)
            fileUploader.$el.removeAttr('multiple');
        fileUploader.$wrapper = fileUploader.$el.parent('.fileUploader__wrapper');
        fileUploader.$label = $('<label class="'+fileUploader.classLabel+'" for="'+fileUploader.id+'">'+(fileUploader.$el.attr('placeholder') || 'Fichier')+'</label>').appendTo(fileUploader.$wrapper)
        fileUploader.$preview = $(` <div class="fileUploader__preview"></div>`).appendTo(fileUploader.$wrapper);
        if (fileUploader.nbPreviewItems)
            fileUploader.$preview.addClass('d-grid cols-'+fileUploader.nbPreviewItems+' cols-lg-'+Math.round(fileUploader.nbPreviewItems/1.5)+' cols-md-'+Math.round(fileUploader.nbPreviewItems/2)+' cols-sm-'+Math.round(fileUploader.nbPreviewItems/3)+' cols-xs-'+Math.round(fileUploader.nbPreviewItems/4)+' cols-xxs-1');
        fileUploader.$previewItem = $(`
            <div class="preview__item">
                <div class="preview__img"></div>
                <div class="preview__label">
                    <div class="preview__name"></div>
                    <div class="preview__size"></div>
                </div>
                <div class="preview__delete"><i class="fa fa-times"></i></div>
            </div>
        `);
        fileUploader.$error = $(`<div class="fileUploader__error"></div>`).appendTo(fileUploader.$wrapper);

        if (app.components.includes('modalFW') && !fileUploader.$el.closest('.modalFW').length)
            fileUploader.$previewItem.append(`<div class="preview__zoomin modalFW__trigger ready" ${(fileUploader.maxFiles != 1)?('data-gallery="gallery-'+fileUploader.id+'"'):''}><i class="fa fa-search"></i></div>`);

        if (fileUploader.helper){
            fileUploader.$helper = $(`
                <div class="fileUploader__helper">
                    <div class="fileUploader__helper__ext">${fileUploader.allowed.join(', ')}</div>
                </div>        
            `);
            if (fileUploader.maxSize)
                fileUploader.$helper.prepend(`<div class="fileUploader__helper__size">max ${(fileUploader.maxSize < 1000)?fileUploader.maxSize + ' Ko':(fileUploader.maxSize/1000).toFixed(1) + ' Mo'}</div>`);
            fileUploader.$preview.after(fileUploader.$helper);
        }

        if (fileUploader.mode == "b64")
            fileUploader.$el.removeAttr(fileUploader.dataAttr);
        
        // events
        fileUploader.$label.on('click',function(){
            if (!fileUploader.$preview.find('.preview__item').length) {
                fileUploader.$el.val(null)
            }
        })

        fileUploader.$el.on('change',function(){
            if (this.files.length){
                fileUploader.displayError(false);
                if (!fileUploader.multiple) {
                    fileUploader.$wrapper.find('input[type=hidden]').remove();
                    fileUploader.$preview.find('.preview__item').remove();
                }
                for(var file of this.files){
                    if (fileUploader.isValid(file) === true) {
                        fileUploader.addPreviewImg(file);
                        if (fileUploader.mode == "b64") 
                            fileUploader.addBase64File(file);
                        fileUploader.onFileAdded(file);
                    }
                }
                if (fileUploader.mode == "b64") 
                    fileUploader.$el.val(null)
            }
        });

        // load default file(s) in the preview
        var cpt = 0;
        var loadFiles = async () => {
            for(var fileUrl of fileUploader.files){
                if (!(fileUploader.maxFiles>0 && cpt>=fileUploader.maxFiles)){
                    if (fileUrl != "") {
                        await fileUploader.addFileFromPath(fileUrl);                        
                        cpt++;
                    }
                }
            }
        };
        loadFiles().then(function(){});

        fileUploader.log('fileUploader created');
        return fileUploader;
    }


    FileUploader.prototype.displayError = function(msg,reset=false){
        var fileUploader = this;
        if (reset || !msg)
            fileUploader.$error.html('');
        if (msg)
            fileUploader.$error.append('<p class="error">'+msg+'</p>');
    }
    FileUploader.prototype.addBase64File = function(file){
        var fileUploader = this;
        return new Promise(function(resolve,reject){
            var reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function(){
                var $input = $('<input type="hidden" class="fileUploader__input" '+fileUploader.dataAttr+'="'+fileUploader.name+'" data-filename="'+file.name+'" value="'+reader.result+'" />');
                fileUploader.$wrapper.append($input);
                var target = fileUploader.$preview.find('[data-filename="'+file.name+'"]').index();
                if (target !== fileUploader.$wrapper.find('.fileUploader__input').index($input))
                    fileUploader.$wrapper.find('.fileUploader__input').eq(target).before($input);
                resolve($input);
            }
        });
    }

    FileUploader.prototype.isValid = function(file){
        var fileUploader = this;
        var result = true;
        var arrFiles = [];
        fileUploader.$preview.find('.preview__item').each(function(){
            arrFiles.push(this.getAttribute('data-filename'));
        });

        fileUploader.log('isValid',file);

        // test max files
        if (fileUploader.maxFiles && arrFiles.length >= fileUploader.maxFiles) 
            result = 'You can\'t upload more than '+fileUploader.maxFiles+' files.';
        // test file type
        // if (fileUploader.allowed && !fileUploader.allowed.includes(file.type.split('/')[1])) 
        // console.log(file.name.match(/(.*)[.]([^.]*)/)[2]);
        var fileType = (file.name.match(/[.].*/) ? file.name.match(/(.*)[.]([^.]*)/)[2]: file.type.split('/')[1]).toLowerCase();
        if (fileUploader.allowed && !fileUploader.allowed.includes(fileType)) 
            result = 'You can\'t upload a '+fileType+' file. Allowed extensions: '+fileUploader.allowed.join(', ');
        // test file size
        if (fileUploader.maxSize && fileUploader.maxSize < getFileSize(file.size).ko) 
            result = 'File size exceeds the maximum limit ('+(fileUploader.maxSize < 1000?fileUploader.maxSize + ' Ko)':(fileUploader.maxSize/1000).toFixed(1) + ' Mo)');
        // test if file already exist
        if (arrFiles.includes(file.name)) 
            result = 'A file named '+file.name+' already exist. You can\'t upload two files with the same name.';

        if (result !== true) {
            result = 'An error occured while retrieving the file <i>'+file.name+'</i> -- '+result;
            fileUploader.displayError(result);
        }
        return result;
    }

    FileUploader.prototype.addFileFromPath = function(path){
        var fileUploader = this;
        var $loader = $('<div class="preview__loader"><i class="fas fa-circle-notch fa-spin"></i></div>');
        var name = path.split('/').at(-1);
        return new Promise(function(resolve,reject){
            var request = async (url) => {
                await fetch(url).then(function(response) {
                    return response.blob();
                }).then( function(blob) {
                    blob.name = url.replace(/^.*[\\\/]/, '');
                    if(fileUploader.isValid(blob) === true){
                        if (fileUploader.mode == "b64") 
                            fileUploader.addBase64File(blob);
                        fileUploader.addPreviewImg(blob).then(function(){
                            if (fileUploader.$preview.find('.preview__item[data-filename="'+name+'"]').length)
                                fileUploader.$preview.find('.preview__loader[data-filename="'+name+'"]').replaceWith(fileUploader.$preview.find('.preview__item[data-filename="'+name+'"]'));
                            fileUploader.onFileAdded(blob);
                        });
                    } else {
                        fileUploader.$preview.find('.preview__loader[data-filename="'+name+'"]').remove();
                    }
                }).catch(function(err){
                    fileUploader.log('addFileFromPath',err);
                    var strError = 'An error occured while retrieving the file '+path;
                    if (typeof err === 'string')
                        strError+= ':<br>'+err; 
                    else
                        strError+= ':<br> Please make sure the path used is correct.'; 
                    fileUploader.displayError(strError);
                    fileUploader.$preview.find('.preview__loader[data-filename="'+name+'"]').remove();
                });
            };
            $loader.clone().attr('data-filename',name).appendTo(fileUploader.$preview);
            request(path);
            resolve();
        });
    }
    FileUploader.prototype.addPreviewImg = function(file,name=false){
        var fileUploader = this;
        return new Promise(function(resolve,reject){
            var $item = fileUploader.$previewItem.clone();
            var img = document.createElement('img');
            if (file instanceof File || file instanceof Blob){
                if (file.type.split('/')[0] == 'image')
                    img.src = window.URL.createObjectURL(file);
                else {
                    if (file.type.split('/')[0] == 'application'){
                        var ext = file.name.split('.').pop();
                        if (Object.keys(FileUploader.iconsFiles).includes(ext))
                            img = '<i class="fa fa-file-'+FileUploader.iconsFiles[ext]+'"></i>';
                        else
                            img = '<i class="fa fa-file"></i>';
                    } else {
                        img = '<i class="fa fa-question-circle"></i>';
                    }
                    $item.find('.preview__zoomin').remove();
                }
                $item.attr('title',name ? name : file.name);
                $item.attr('data-filename',name ? name : file.name);
                $item.find('.preview__name').html(name ? name : file.name);
                $item.find('.preview__size').html(getFileSize(file.size).str);
            } else {
                if (utils.isImageUrl(file)){
                    img.src = file;
                    $item.attr('data-filename',file);
                }
            }
            $item.find('.preview__img').html(img);
            fileUploader.$preview.append($item);
            fileUploader.setFilesActions();
            resolve();
        });
    }

    FileUploader.prototype.setFilesActions = function(){
        var fileUploader = this;
        fileUploader.$preview.find('.preview__item .preview__delete').off('click').on('click',function(){
            var index = $(this).closest('.preview__item').index();
            fileUploader.onFileDeleted($(this).closest('.preview__item').attr('data-filename'));
            $(this).closest('.preview__item').remove();
            fileUploader.$wrapper.find('input[type=hidden]').eq(index).remove();
            fileUploader.displayError(false);
        });

        fileUploader.$preview.find('.preview__item .preview__zoomin').off('click').on('click',function(){
            var img = $(this).closest('.preview__item').find('img');
            var modalScript = new app.ModalFW({
                name : 'modalFileUploader--'+utils.uniqid(),
                $trigger: $(this),
                gallery: (fileUploader.maxFiles != 1)?'gallery-'+fileUploader.id:false,
                content: img.clone(),
                onClose: function(){
                    modalScript.destroy();
                }
            });
            modalScript.$el.addClass('modalFW--img');
            modalScript.open();
        });
    }

    function getFileSize(bytes) {
        var result = {
            ko: (bytes/1024).toFixed(1)
        };
        if(bytes < 1024) {
            result.str = bytes + ' octets';
        } else if(bytes >= 1024 && bytes < 1048576) {
            result.str = (bytes/1024).toFixed(1) + ' Ko';
        } else if(bytes >= 1048576) {
            result.str = (bytes/1048576).toFixed(1) + ' Mo';
        }
        return result;
    }

    $(function () {
        $('input[type=file]').not('.custom,.fileUploader,.ck-hidden').fileUploader();
        utils.addHtmlHook('input[type=file]:not(.custom):not(.fileUploader)', function(item){
            item.fileUploader();
        });
    });


    return FileUploader;
}