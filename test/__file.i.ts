///<reference path="../src/com/display/Bitmap.ts"/>
///<reference path="../src/demo/test/MiClase.ts"/>
interface IExternalizable extends IComparable
{
    method( ba:jDataView ):void;
    method1 ( ba:jDataView ):void;

    num:number;
    num1: number;
    num2 : number;
    func:()=>void;
    func1: ()=>void;
    func2 : ()=>void;
    juan:number;
}
interface ISecondInterface extends IComparable
{
    method( ba:jDataView ):void;
    method1 ( ba:jDataView ):void;

}

//@Embed { src:'file.svg', exports:'es.xperiments.graphics.TestShape', destination:'file.js'  };
//@SourceFolder { src:'xxxx' }





















/*!DuckTypingInterfacePreprocesorGeneratedCommentsStart*/

    class IIExternalizable implements IInterfaceChecker
    {
        className:string = 'IExternalizable';
        methodNames:string[] = ["method","method1","func","func1","func2"];
        propertyNames:string[] = ["num","num1","num2","juan"];
    }

    class IISecondInterface implements IInterfaceChecker
    {
        className:string = 'ISecondInterface';
        methodNames:string[] = ["method","method1"];

    }
/*!DuckTypingInterfacePreprocesorGeneratedCommentsEnd*/
