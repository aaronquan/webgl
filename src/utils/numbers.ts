type Float = number;

export function distanceSq(x1: Float, y1: Float, x2: Float, y2: Float): Float{
    const dx = x1 - x2;
    const dy = y1 - y2;
    return dx*dx + dy*dy;
}

export function distance(x1: Float, y1: Float, x2: Float, y2: Float): Float{
    return Math.sqrt(distanceSq(x1, y1, x2, y2));
}