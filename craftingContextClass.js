console.log('Generic crafting system');
/*

--- Crafting ---

Usar un solo tipo de operación para craftear, y adaptarlo a distintos usos:

Crafting común: simplemente poner como output el item resultante
Ej: harina + agua => masa

Herramientas: Poner como output el item resultante, y también la herramienta
masa + rodillo => masa plana + rodillo

Modelando eficiencia de herramientas:
Si quiero generar 100 masas planas con un rodillo, lo tengo que hacer secuencialmente,
O tener 100 rodillos disponibles a la vez, y en cualquier caso es engorroso.
Puedo hacer recetas del tipo:
25 masas + máquina amasadora => 25 masas planas + máquina amasadora
para representar herramientas más eficientes. Como no puedo usar la máquina amasadora si tengo
menos de 25 masas, se crea un balance interesante, en donde necesito una variedad de herramientas
para cubrir todos los casos.

Extracción: Lo mismo que herramientas
vaca + [trabajo] => vaca + leche

Así puedo usar una sola lista de recetas.

--- Cantidades ---

TODOS los items se cuentan en cantidad, en uno o más inventarios. No hay items individuales
ni con propiedades específicas.

Un inventario es un objeto que contiene entradas asociando un string (clase de item), con un
número.

Las recetas simplemente evalúan la existencia de esos strings y modifican los números (y agregan
otros strings, quizá).

*/


class CraftingContext {

    constructor(){
        this.recipes = {
            'dough': {
                input: {
                    'flour': 2,
                    'water': 1
                },
                output: {
                    'dough': 2,
                },
            },
            'roll flattened dough': {
                input: {
                    'dough': 1,
                    'roll': 1
                },
                output: {
                    'flattened dough': 1,
                    'roll': 1
                },
            },
            'machine flattened dough': {
                input: {
                    'dough': 25,
                    'rolling machine': 1,
                },
                output: {
                    'flattened dough': 25,
                    'rolling machine': 1,
                },
            }
        };
        this.inventories = {
            'backpack': {
                flour: 25,
                water: 2,
              },
            'house': {
                water: 4,
            },
            'world': {
                water: 1000,
            }
        };
    }


    showRecipes(){
        console.log('-- All recipes --');
        for(let recipe in this.recipes){
            console.log('- ' + recipe);
        }
    }

    viewRecipe(recipe){
        console.log('-- Viewing recipe: '+ recipe +' --');
        console.log('Materials needed:');
        for(let item in this.recipes[recipe].input){
            console.log('- ' + this.recipes[recipe].input[item] + ' ' + item);
        }
        console.log('Items created:');
        for(let item in this.recipes[recipe].output){
            console.log('- ' + this.recipes[recipe].output[item] + ' ' + item);
        }
    }


    /**
     * makeRecipe
     * Public method for the user to craft items.
     *
     * @param {string} inventoryName - The corresponding key in the inventory list
     * @param {string} recipeName - The  corresponding keyin the recipes list
     * @param {number} qty - The quantity of items to craft
     * @example
     *     makeRecipe('backpack', 'dough', 1)
     */
    makeRecipe(inventoryName, recipeName, qty){

        if ( qty < 1 )
            { console.log('Quantity must be 1 or larger'); return }
        if ( qty !== Math.round(qty) )
            { console.log('Quantity must be an integer number'); return }

        //Check if we have all the materials we need first
        let quantitiesNeeded = this._calculateMaterialsNeeded(recipeName, qty);
        let inventory = this.inventories[inventoryName];
        for (let material in quantitiesNeeded){
            let materialIsEnough = this._checkForEnoughMaterial(inventory, material, quantitiesNeeded[material]);
            if (materialIsEnough === false) {
                return;
            }
        }

        //If so, subtract them from inventory
        for ( let material in quantitiesNeeded ) {
            this._subtractFromInventory(material, inventory, quantitiesNeeded[material]);
        }
        //Calculate how much crafted items we will get, and add them to inventory
        let quantitiesCrafted = this._calculateItemsCrafted(recipeName, qty);
        for ( let item in quantitiesCrafted ) {
            this._addToInventory(item, inventory, quantitiesCrafted[item]);
        }
        console.log('--- item crafted ---');
    }


    /* --------- */
    /**
     * _checkForEnoughMaterial
     * Private method
     *
     * @param {object} inventory - A property from the global inventories object
     * @param {string} material - The name of the material needed
     * @param {number} qty - The quantity of material needed
     * @return {boolean} - whether the materials are enough or not
     */

    _checkForEnoughMaterial (inventory, material, quantity){
        if(!inventory[material]){
            console.log('You don\'t have ' + material);
            console.log('Quantity needed: ' + quantity);
            return false;
        }
    
        if (inventory[material] < quantity){
            console.log('Not enough ' + material + ' in inventory');
            console.log('Quantity needed: ' + quantity);
            console.log('Quantity available: ' + inventory[material]);
            return false;
        }
        return true;
    }


    /* --------- */


    /**
     * _subtractFromInventory
     * Private method
     *
     * @param {string} materialName - The name of the material to subtract
     * @param {string} inventory - The inventory from which the material should be subtracted
     * @param {number} quantity - How much to subtract
     */
     _subtractFromInventory (materialName, inventory, quantity) {
        let quantityAfterSubtraction = inventory[materialName] - quantity;
        
        if(quantityAfterSubtraction < 0){
            console.log('not enough ' + materialName + ' to subtract from inventory');
            return;
        }
        //If we have depleted the item from the inventory, remove the key
        if(quantityAfterSubtraction === 0){
            delete inventory[materialName];
            return;
        }
        //If not, update the inventory
        inventory[materialName] = quantityAfterSubtraction;
    }


    /* --------- */

    /**
     * _addToInventory
     * Private method
     *
     * @param {string} materialName - The name of the material to add
     * @param {string} inventory - The inventory to which the material should be added
     * @param {number} quantity - How much to add
     */
    _addToInventory (materialName, inventory, quantity) {
        //If we didn't have this item in inventory, add the key
        if(!inventory[materialName]){
            inventory[materialName] = 0;
        }
        //And update the inventory
        inventory[materialName] = inventory[materialName] + quantity;
    }



    /* --------- */

    /**
     * _calculateItemsCrafted
     * Private method
     *
     * @param {string} recipeName - The name of the recipe to craft
     * @param {string} qty - How much times the recipe will be crafted
     * @return {object} - An object containing items as keys, and quantities crafted as values
     */
    _calculateItemsCrafted(recipeName, qty){
        let recipe = this.recipes[recipeName];
        let namesOfItemsCrafted = Object.keys(recipe.output);
    
        let quantitiesMade = {};
    
        for ( let itemName of namesOfItemsCrafted) {
            let quantityMade = qty * recipe.output[itemName];
            quantitiesMade[itemName] = quantityMade;
        }
        return quantitiesMade;
    }



    /* --------- */

    /**
     * _calculateMaterialsNeeded
     * Private method
     *
     * @param {string} recipeName - The name of the recipe to craft
     * @param {string} qty - How much times the recipe will be crafted
     * @return {object} - An object containing materials as keys, and quantities needed as values
     */
    _calculateMaterialsNeeded(recipeName, qty){
        let recipe = this.recipes[recipeName];
        let namesOfNeededMaterials = Object.keys(recipe.input);
    
        let quantitiesWeNeed = {};
    
        for ( let materialName of namesOfNeededMaterials) {
            let quantityNeeded = qty * recipe.input[materialName];
            quantitiesWeNeed[materialName] = quantityNeeded;
        }
        return quantitiesWeNeed;
    }
}