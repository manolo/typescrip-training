export type Validator<T> = (input: any) => T

export function string(input: any) {
    if (typeof input !== "string") throw Error("not a string: " + input)
    return input as string
}

export function number(input: any) {
    if (typeof input !== "number") throw Error("not a number: " + input)
    return input as number
}

export function boolean(input: any) {
    if (typeof input !== "boolean") throw Error("not a boolean: " + input)
    return input as boolean
}

export function array<T>(elemValidator: Validator<T>) {
    return (input: any) => {
        if (!(input instanceof Array)) throw Error("Not an array: " + input)
        input.forEach(elemValidator)
        return input as Array<T>
    }
}

type ObjectIntersection<A, B> = {
    [key in (keyof A | keyof B)]: key extends keyof A
        ? A[key]
        : key extends keyof B
            ? B[key]
            : never
}

type Intersection<A, B> = A extends object
    ? B extends object
        ? ObjectIntersection<A, B>
        : A & B
    : A & B

export function intersection<A, B>(a: Validator<A>, b: Validator<B>): Validator<Intersection<A, B>>;    
export function intersection<A, B, C>(a: Validator<A>, b: Validator<B>, c: Validator<C>): Validator<Intersection<A, Intersection<B, C>>>;
export function intersection(...validators: Validator<any>[]): Validator<any> {
    return (input: any) => {
        validators.forEach(v => v(input))
        return input;
    }
}

type ObjectSpec<T> = {
    [key in keyof T]: Validator<T[key]>
}

export function object<T>(spec: ObjectSpec<T>): Validator<T> {
    return (input: any) => {
        if (typeof input !== "object") throw Error("Not an object: " + input)
        Object.entries(spec).forEach(([key, validator]) => {
            (validator as Validator<any>)(input[key])    
        })
        return input as T
    }    
}
