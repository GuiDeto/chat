module.exports = function (grunt) {
    'use strict';

    grunt.initConfig({
        uglify: {
            my_target: {
                files: {
                    'public/js/app.min.js': ['public/js/app.js', 'public/js/dropzone_file_send.js']
                }
            },
            watch: {
                scripts: {
                    files: ['public/js/app.js', 'public/js/dropzone_file_send.js'],
                    tasks: ['uglify']
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify-es');
    grunt.registerTask('default', ['uglify']);
};