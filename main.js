const pegjs = require("pegjs");
const _ = require("lodash")

const grammar = `{
    function withCounts(p){
        var obj = {}
        p.forEach(key=>{
            obj[key] = typeof obj[key] === 'undefined' ? 1 : obj[key] + 1
        });
        return obj;
    }
}

start = statement*

statement =  makepizza / modifypizza / ifstatement / print

print = 'print' WS '"' m:[a-zA-Z ]* '"' WS {
	return {
		type: "print",
    	message: m.join('')
     };
}

ifstatement = 'if' WS b:booleanexpression WS ':' WS s:statement* WS 'endif' WS{
	return {
		type: "ifstatement",
    	test: b,
        body:s
     };
}

booleanexpression = p:varname'\\'s' WS i:ingredient WS o:("is" / "<" / ">") WS n:number {
	return {
		type: "booleanexpression",
    	operator: o,
        name:p,
        ingredient:i,
        value:n
     };
}

number = fraction / wholenumber

wholenumber = n:[0-9]+{
	return parseInt(text())
}

fraction = n:wholenumber WS '/' WS d:wholenumber {
	return n/d
}

makepizza = 'make a pizza with'i WS i:ingredients WS 'called'i WS p:varname WS {
	return {
		type: "assign",
    	name:p,
        value:withCounts(i)
     };
}

modifypizza = addpizza / removepizza

addpizza = 'add' WS i:ingredient WS 'to' WS p:varname WS{
	return {
    	type: 'modify',
        name:p,
        ingredient:i,
        amount:1
    }
}

removepizza = 'remove' WS i:ingredient WS 'from' WS p:varname WS{
	return {
    	type: 'modify',
        name:p,
        ingredient:i,
        amount:-1
    }
}

ingredient = 'cheese'i / 'mushrooms'i / 'spinach'i / 'tomato'i / 'salt and pepper'

andingredient = WS 'and' WS i:ingredient{
	return i;
}

ingredients = first:ingredient list:andingredient* {
	return [first, ...list];
}

varname = var0:[a-zA-Z_]+ var1:[a-zA-Z0-9_]* {
	return var0.join("") + var1.join("")
}

WS = [ \\t\\n]*
`;

const parser = pegjs.generate(grammar);

const variables = {}
const stack = []

function visit(node){
    if(node.type === "assign"){
      variables[node.name] = node.value;
    }
    else if (node.type == 'modify'){
        pizza = variables[node.name]
        pizza[node.ingredient] = typeof pizza[node.ingredient] === "undefined" ? node.amount : pizza[node.ingredient] + node.amount
    }
    else if (node.type == 'print'){
        console.log(node.message);
    }
    else if (node.type == 'booleanexpression'){
        pizza = variables[node.name]
        const total = _.sum(Object.values(pizza));
        const value = pizza[node.ingredient]/total == node.value;
        stack.push(value)
    }
    else if (node.type == 'ifstatement'){
        visit(node.test)
        if(stack.pop()){
            node.body.forEach(node=>{
                visit(node);
            })
        }
    }
}


const code = `Make a pizza with cheese and Tomato called johnspizza
Make a pizza with cheese and mushrooms called joannaspizza
add cheese to johnspizza
if johnspizza's cheese is 2/3:
print "Great"
endif
remove cheese from joannaspizza
if joannaspizza's mushrooms is 1:
print "Also great"
endif
`;
const ast = parser.parse(code);
ast.forEach(visit);
