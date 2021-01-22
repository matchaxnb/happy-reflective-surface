module.exports = function( grunt ) {

	require('load-grunt-tasks')(grunt);
	'use strict';

	// Project configuration
	grunt.initConfig( {

		pkg: grunt.file.readJSON( 'package.json' ),

		addtextdomain: {
			options: {
				textdomain: 'bright-mirror',
			},
			update_all_domains: {
				options: {
					updateDomains: true
				},
				src: [ '*.php', '**/*.php', '!\.git/**/*', '!bin/**/*', '!node_modules/**/*', '!tests/**/*' ]
			}
		},

		wp_readme_to_markdown: {
			your_target: {
				files: {
					'README.md': 'readme.txt'
				}
			},
		},
		gitinfo: {
			commands: {
				'local.tag.current.name': ['name-rev', '--tags', '--name-only', 'HEAD'],
				'local.tag.current.nameLong': ['describe', '--tags', '--long']
			}
		},

		clean: {
			main: ['dist'], //Clean up build folder
			i18n: ['languages/*.mo', 'languages/*.pot']
		},
		copy: {
			// Copy the plugin to a versioned release directory
			main: {
				src: [
					'**',
					'!*.xml', '!*.log', //any config/log files
					'!node_modules/**', '!Gruntfile.js', '!package.json', '!package-lock.json', '!yarn.lock', //npm/Grunt
					'!assets/**', //wp-org assets
					'!dist/**', //build directory
					'!.git/**', //version control
					'!tests/**', '!scripts/**', '!phpunit.xml', '!phpunit.xml.dist', //unit testing
					'!vendor/**', '!composer.lock', '!composer.phar', '!composer.json', //composer
					'!wordpress/**',
					'!.*', '!**/*~', //hidden files
					'!CONTRIBUTING.md',
					'!README.md',
					'!docker-compose.override.yml', // Local Docker Development configuration.
					'!codecov.yml', // Code coverage configuration.
					'!tools/**', // Local Development/Build tools configuration.
					'!bin/**', // Binary tools
				],
				dest: 'dist/',
				options: {
					processContentExclude: ['**/*.{png,gif,jpg,ico,mo}'],
					processContent: function (content, srcpath) {
						if (srcpath == 'readme.txt' || srcpath == 'bright-mirror.php') {
							if (grunt.config.get('gitinfo').local.tag.current.name !== 'undefined') {
								content = content.replace('{{version}}', grunt.config.get('gitinfo').local.tag.current.name);
							} else {
								content = content.replace('{{version}}', grunt.config.get('gitinfo').local.tag.current.nameLong);
							}
						}
						return content;
					},
				},
			}
		},
		makepot: {
			target: {
				options: {
					domainPath: '/languages',
					exclude: [ '\.git/*', 'bin/*', 'node_modules/*', 'tests/*' ],
					mainFile: 'bright-mirror.php',
					potFilename: 'bright-mirror.pot',
					potHeaders: {
						poedit: true,
						'x-poedit-keywordslist': true
					},
					type: 'wp-plugin',
					updateTimestamp: true
				}
			}
		},
	} );

	grunt.loadNpmTasks( 'grunt-wp-i18n' );
	grunt.loadNpmTasks( 'grunt-wp-readme-to-markdown' );
	grunt.registerTask( 'default', [ 'i18n','readme' ] );
	grunt.registerTask( 'i18n', ['addtextdomain', 'makepot'] );
	grunt.registerTask( 'readme', ['wp_readme_to_markdown'] );
	grunt.registerTask('build', ['gitinfo', 'clean', 'i18n', 'readme', 'copy']);

	grunt.util.linefeed = '\n';

};
