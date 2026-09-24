import * as Equation from "./equation"

type Float = number;

type GraphEquation = {
    equation: Equation.Equation,
    end_point: Float
}

//uses equations to create 1 x -> 1 y graph
class CustomEquationGraph{
    equations: GraphEquation[];
    constructor(){
        this.equations = [];
    }

    addEquation(equation: Equation.Equation, end_point: Float){
        this.equations.push({equation, end_point});
    }

    getY(){
        
    }
}