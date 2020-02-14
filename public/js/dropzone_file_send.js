Dropzone.prototype.defaultOptions.dictDefaultMessage = "Arraste a imagem aqui";
Dropzone.prototype.defaultOptions.dictFallbackMessage = "Seu navegador não suporta arrastar o arquivo.";
Dropzone.prototype.defaultOptions.dictFallbackText = "Por favor, use o formulário de fallback abaixo para fazer upload de seus arquivos, como nos velhos tempos.";
Dropzone.prototype.defaultOptions.dictFileTooBig = "Arquivo é muito grande ({{filesize}}MiB). Tamanho maximo: {{maxFilesize}}MiB.";
Dropzone.prototype.defaultOptions.dictInvalidFileType = "Você não pode fazer upload de arquivos deste tipo.";
Dropzone.prototype.defaultOptions.dictResponseError = "Servidor respondeu com {{statusCode}} codigo.";
Dropzone.prototype.defaultOptions.dictCancelUpload = "Cancelar upload";
Dropzone.prototype.defaultOptions.dictCancelUploadConfirmation = "Tem certeza de que deseja cancelar este upload?";
Dropzone.prototype.defaultOptions.dictRemoveFile = "Remover arquivo";
Dropzone.prototype.defaultOptions.dictMaxFilesExceeded = "Você não pode enviar mais arquivo.";

Dropzone.options.dropchatfiles = {
    paramName: function(n) { return 'source_file[]';},
    maxFilesize: 5, // MB
    autoProcessQueue: true,
    uploadMultiple: false,
    parallelUploads: 1,
    dictDefaultMessage: 'Clique ou arraste o arquivo aqui!',
    acceptedFiles: '.jpg,.jpeg,.pdf,.doc,.docx,.xls,.xlsx',
    init: function () {
        this.on('success', function (file) {
            document.querySelectorAll('#upload-modal')[0].classList.value = 'modal fade';
            document.querySelector('.modal-backdrop').classList.value = 'modal-backdrop fade'
        });
    }

};