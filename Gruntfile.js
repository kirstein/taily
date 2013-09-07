module.exports = function( grunt ) {
  'use strict';

  var SRC = 'src';

  grunt.initConfig({
    watch: {
      test : {
        files : [ '*.js', 'test/**/*.js' ],
        tasks : [ 'test' ]
      }
    },
    mochaTest : {
      options : {
        ui : 'bdd',
        require : 'should',
        //quiet : true,
        reporter: 'dot',
        growl : true,
        ignoreleaks: false
      },
      spec : {
        src: [ 'test/spec/*.spec.js' ]
      },
      integration : {
        src : [ 'test/integration/*.it.js' ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('test', [ 'mochaTest' ]);
  grunt.registerTask('default', [ 'test' ]);
};
