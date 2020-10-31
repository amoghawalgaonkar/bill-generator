export class Products {
    quantity: Number;
    category: Number;
    cost: Number;
    description: String;

    constructor(values: Object = {}) {
        Object.assign(this, values);
    }
}