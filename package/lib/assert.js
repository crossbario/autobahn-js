console.assert	= function(cond, text){
	if( cond )	return;
	if( console.assert.useDebugger || AUTOBAHN_DEBUG)	debugger;
	throw new Error(text || "Assertion failed!");
};