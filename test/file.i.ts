///@import es.xperiments.Test1;
///<reference path="../src/plugins/EmbedParser.ts"/>@import plugins.EmbedParser;


///@inspect;




///-embed { src:'shape.svg', library:'libraryName', export:'es.xperiments.ShapeImage', format:'png' }
///-embed { src:'shape.svg', library:'libraryName', export:'es.xperiments.ShapeVector', format:'code' }

///-embed { src:'shape.svg', library:'SecondLibrary', export:'es.xperiments.Shape', format:'code' }

/*
{
    'libraryName':
    {
         'demo':
         {
         	 'src':'demo.png'
            ,'type':'png'
            ,'forceUpdate':true
         }
        ,'code':
        {
 			 'src':'code.js'
			,'type':'code'
 			,'forceUpdate':true
 		}
        ,'es.xperiments.ShapeImage':
		{
			 'src':'demo.png'
			,'type':'png'
 			,'forceUpdate':true
		}
        ,'es.xperiments.ShapeVector':
        {
        	 'src':'demo.png'
			,'type':'code'
 			,'forceUpdate':true
 		}
    }

}
*/




