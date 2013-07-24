# TypescriptPreprocessor

A typescript preprocessor helper based on simple attachable plugins.

## Avaliable Plugins: ##

* @embed  -> embeds png,svg,js,txt into a png library file.
* @source -> adds more than one source folder to classpath.
* @import -> use cls.ass.packages as imports. Automatically resolves relative reference paths.
* @define -> use cls.ass.packages as definition imports. Automatically resolves relative reference paths to .d.ts files.


## Dependencies ##

TypescriptPreprocessor uses many dependecies but one [ node-canvas ] needs Cairo as a backed Canvas implementation for NodeJS so:

	Unless previously installed you'll need Cairo!!!.

### Cairo download & instalation instructions

* [http://cairographics.org/download/](http://cairographics.org/download/)
* [https://github.com/LearnBoost/node-canvas/wiki/_pages](https://github.com/LearnBoost/node-canvas/wiki/_pages)

( Installed it with ports without problems but sometimes is a little complicated to get Cairo installed )

## Installation ##

	sudo npm install -g TypescriptPreprocessor
	
#### EMFILE max files open error ####

If you get an EMFILE max files open error during install.
You need to CHANGE the max open files opened to a higher value with the command:
	
	$ sudo ulimit -n 1024
	
This is only a temporally fix but it gets the work done!	
## Command line usage ##

	Usage: tsp --root projectRootDir -source inputFile

	Options:
	  -r, --root     Project Root dir
	  -s, --source   Source file
	  -i, --install  Install Preprocessor to project


## WebStorm Integration##

###ToolbarIcon and ExternalTools:###


To install the ExternalTools & Toolbar integration:

* Open Webstorm.
* Goto to file import settings.
* Localize the file TSPSettings.jar and load it.
* Restart. Done!!

Now every time you need to process a xxxx.lib.tsp, sources.tsp or any .ts file containing @import/@define directives you can **tap the new icon [TS] in the toolbar** to get the preprocessing done ;-)


## Getting started ##

### Preparing a new TSP project ###

First you need to install the tool to your current project.

	$ cd /path/to/your/project
	$ tsp --install

A typical setup will involve **adding two files** to your project: **config.tsp** and the **sources.tsp**

### config.tsp ###

Here you can configure some plugin preferences

	{
		"root": "/path/to/your/project",
		"pluginData": {
			"SourcePaths": {
				"sources": [
					// DO NOT TOUCH
					// Here will be the project source
					// folders where TSP will search for
					// classes & definitions
				]
			},
			"ImportsToReference": {
				"enableUndo": false
				//By default @import will remove the @import directive
				//after processing.
				//Set to true to leave it untouched   
			},
			"DefinitionToReference": {
				"enableUndo": false
				//By default @define will remove the @define directive
				//after processing.
				//Set to true to leave it untouched 				
			}
		}
	}


### sources.tsp

Use this file to define the TSP project sourceFolders.
When TSP finds a ///@import or ///@define directive it will search across all the sourceFolders to test if it can find the import/define file.

In the next example I have defined 2 main sourceFolders: src and otherSourceFolder.

### Defining multiple source folders
**(for now...) Source folders must be relative to the project root** 


	///<!SOURCE_FOLDER_PATHS>
	///@source /src
	///@source /otherSourceFolder

Command line processing:

	$ tsp --root /path/to/your/project --source sources.tsp
	
## Embending content

To use the embed directives **you must create a file named xxxx.lib.tsp**.

The resulting png file name will be **xxxx.lib.png**

The @embed & @embedLibrary directives provides a simple way of generating a library of "media elements", allowing to embed inside the resulting png image:

* SVG files that will be converted to png or Canvas context instructions
* ( More on svg conversion [https://github.com/xperiments/svg2ctx](https://github.com/xperiments/svg2ctx) )
* PNG files
* JS Files
* CSS files
* Other text files

Command line processing:

	$ tsp --root /path/to/your/project --source /path/to/your/xxxxx.lib.tsp


#### @embedLibrary Usage

**( You must declare the @embedLibrary before any @embed directive )**

The @embedLibrary directive lets us specify:

* The resulting library export name
* The method for "Texture Packing"
* The optimization method of the resulting png file

Usage inside xxxx.lib.tsp:( **pay attention to the ///@embed… format** )

	///@embedLibrary{name:'LibraryExportedName',sort:'area',compression:'none'}


##### options #####
	name: The resulting library export name
	sort: The method for "Texture Binary Packing"
	
	  * maxside [Default]
	  * width
	  * height
	  * area

	compression: The optimization method of the resulting png file 

	  * none
	  * low
	  * med
	  * high
	  * best

#### @embed Usage

**( You must declare the @embed after the @embedLibrary directive )**

The @embed directive lets us add an element to the current library:

	///@embedLibrary{name:'LibraryExportedName',sort:'area',compression:'none'}
	///@embed { src:'sourceFile.png', member:'myPNG' }
	///@embed { src:'sourceFile.js',  member:'myJS' }
	///@embed { src:'sourceFile.svg', member:'mySVG_PNG', format:'png' }
	///@embed { src:'sourceFile.svg', member:'mySVG_CTX', format:'ctx' }	


##### options #####

	///@embed { src:'sourceFile.svg', member:'mySVG_CTX', format:'ctx' }
	
	src: The source file to include
	member: The exported library member name
	format: Used only in svg files to specify the output format.

	  * png => converts the svg to a png image and includes it in the lib.
	  * ctx => converts the svg to a js file containing a class
	           that you can use to render the svg to a canvas


#### Loading back the library ####

For loading back the elemens from the library you need to use the [TypescriptPreprocessor-Loader](https://github.com/xperiments/TypescriptPreprocessor-Loader) library.

Example code:

	$LIB.load('demo.lib.png').on(pulsar.events.Event.COMPLETE, onLoaded );
	function onLoaded()
	{
		// Reference to our current loaded library
		// Remeber that the name must correspond to the one
		// you assigned in the
		// @embedLibrary{ name:'xxxx' ...
		var myLib = $LIB('TestLibrary');
		
		// returns the master library png image [HTMLImageElement]
		var libraryImage = myLib.getLibImage(); 
		
		// returns "myCanvasElement" as a [HTMLCanvasElement] 
		var canvasElement = myLib.getCanvas("myCanvasElement");
		
		// returns "myImageElement" as a [HTMLImageElement]
		var myImageElement = myLib.getImage("myImageElement");
		
		// returns "myCustomCode" as a string
		var myCustomCode = myLib.getCode("myCustomCode");
		
		// returns "myShapeElement" as a pulsar.lib.shapes.Shape instance
		var myShapeElement = myLib.getShape("myShapeElement");
		
		// injects "myCssCode" into the DOM
		var myCssCode = myLib.injectCss("myCssCode");
		
		// injects "myJSCode" into the DOM
		var myJSCode = myLib.injectScript("myJSCode");
	
	}
	
In depth TypescriptPreprocessor-Loader usage:
[http://xperiments.github.io/TypescriptPreprocessor/](http://xperiments.github.io/TypescriptPreprocessor/)


## TS Language Directives ##
### @import & @define directives:
Translates @import @define with package names to relative ///\<reference path="…."/>

```
///@import es.xperiments.Demo
///@define es.xperiments.Demo
```
becomes:

```
///<reference path='src/es/xperiments/demo.ts'/>
///<reference path='src/es/xperiments/demo.d.ts'/>
```

Also you can configure the "enableUndo" property inside the tsp.config.js to let the preprocessor to no remove the original directive. This way you can easely revert to the original @import @define directive.

```
///@import es.xperiments.Demo
///@define es.xperiments.Demo
```
becomes:

```
///<reference path='src/es/xperiments/demo.ts'/>@import es.xperiments.Demo
///<reference path='src/es/xperiments/demo.d.ts'/>@define es.xperiments.Demo 
```
Command line processing:

	$ tsp --root /path/to/your/project --source /path/to/your/xxxxx.ts