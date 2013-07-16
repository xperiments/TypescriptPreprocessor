///@multiline name
/*
 <option value="96" >Mootools 1.4.5 (compat)</option>
 <option value="95" >Mootools 1.4.5</option>
 <option value="63" >Mootools 1.3.2 (compat)</option>
 <option value="62" >Mootools 1.3.2</option>
 <option value="144" >Mootools 1.2.6</option>
 <option value="59" >Mootools (edge)</option>
*/

///@multiline datos
/*
var SingletonDemo = (function () {
	function SingletonDemo() {
		if (!SingletonDemo.allowInstantiation) {
			throw new Error("Error: Instantiation failed: Use SingletonDemo.getInstance() instead of new.");
		}
	}
	SingletonDemo.getInstance = function () {
		if (SingletonDemo.instance == null) {
			SingletonDemo.allowInstantiation = true;
			SingletonDemo.instance = new SingletonDemo();
			SingletonDemo.allowInstantiation = false;
		}
		return SingletonDemo.instance;
	};
	return SingletonDemo;
})();
*/

\n\
var SingletonDemo = (function () {                                                                \n\
	function SingletonDemo() {                                                                       \n\
		if (!SingletonDemo.allowInstantiation) {                                                        \n\
			throw new Error("Error: Instantiation failed: Use SingletonDemo.getInstance() instead of new.");\n\
		}                                                                                               \n\
	}                                                                                                \n\
	SingletonDemo.getInstance = function () {                                                        \n\
		if (SingletonDemo.instance == null) {                                                           \n\
			SingletonDemo.allowInstantiation = true;                                                       \n\
			SingletonDemo.instance = new SingletonDemo();                                                  \n\
			SingletonDemo.allowInstantiation = false;                                                      \n\
		}                                                                                               \n\
		return SingletonDemo.instance;                                                                  \n\
	};                                                                                               \n\
	return SingletonDemo;                                                                            \n\
})();                                                                                             \n\
\n\

